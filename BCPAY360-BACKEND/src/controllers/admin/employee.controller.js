import db, { dbExec } from "../../config/db.js";
import bcrypt from "bcrypt";
import { TABLES } from "../../utils/tableNames.js";
import {
  uploadToS3,
  deleteFromS3,
  generateS3Key
} from "../../utils/s3.util.js";
import {
  createEmployeeService,
  listEmployeesService,
  getEmployeeByIdService,
  deleteEmployeeService,
  updateEmployeeService,
  activateEmployeeService
} from "../../services/employee.service.js";
import { 
  notifyEmployeeCreated, 
  notifyProfileUpdated, 
  notifyStatusChanged 
} from "../../services/employee.communication.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "EMPLOYEE_CONTROLLER";

/**
 * CREATE EMPLOYEE
 */
export const create_employee = async (req, res) => {
  let stage = 'INITIAL_VALIDATION';
  const uploadedFiles = []; 

  try {
    let { employeeForm, profileForm, documentsForm } = req.body;

    // 1. Parse JSON safely from multipart/form-data
    try {
      if (typeof employeeForm === 'string') employeeForm = JSON.parse(employeeForm);
      if (typeof profileForm === 'string') profileForm = JSON.parse(profileForm);
      if (typeof documentsForm === 'string') documentsForm = JSON.parse(documentsForm);
    } catch (err) {
      return res.status(400).json({ error_code: "INVALID_JSON", message: "Invalid JSON in form data" });
    }

    const company_id = req.user.company_id;
    if (!company_id) throw new Error("Company context missing");

    // 2. Map phone to phone_number if needed
    if (employeeForm && !employeeForm.phone_number && employeeForm.phone) {
      employeeForm.phone_number = employeeForm.phone;
    }

    // 3. Validate required core fields
    const required = ['full_name', 'employee_code', 'branch_id', 'department_id', 'designation_id', 'joining_date', 'email', 'password'];
    const missing = required.filter(f => !employeeForm?.[f]);
    if (missing.length > 0) {
      return res.status(400).json({ error_code: "VALIDATION_FAILED", reason: `Missing fields: ${missing.join(', ')}` });
    }

    stage = 'S3_UPLOAD';
    const password_hash = await bcrypt.hash(employeeForm.password, 10);

    // Fetch names for S3 Folder Structure: company_name/branch_name/emp_code/personal/
    const [[company]] = await db.query(`SELECT company_name FROM ${TABLES.COMPANIES} WHERE id = ?`, [company_id]);
    const [[branch]] = await db.query(`SELECT branch_name FROM ${TABLES.BRANCHES} WHERE id = ?`, [employeeForm.branch_id]);

    if (!company || !branch) throw new Error("Company or Branch not found for S3 key generation");

    const filesArray = req.files || [];
    const uploadedFilesData = {};

    for (const file of filesArray) {
      // Logic for Category: profile_photo vs other personal documents
      const category = file.fieldname === 'profile_photo' ? 'profile' : 'personal';
      const fullKey = generateS3Key(company.company_name, branch.branch_name, employeeForm.employee_code, category, file.originalname);
      
      const uploadResult = await uploadToS3(file.buffer, fullKey, file.mimetype);
      
      const fileEntry = {
        url: uploadResult.url,
        key: uploadResult.key,
        originalname: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname
      };

      if (!uploadedFilesData[file.fieldname]) uploadedFilesData[file.fieldname] = [];
      uploadedFilesData[file.fieldname].push(fileEntry);
      uploadedFiles.push(uploadResult.key);
    }

    stage = 'DATABASE_INSERTION';
    const result = await createEmployeeService({
      employeeForm: { ...employeeForm, password_hash },
      profileForm: { ...profileForm },
      documentsForm: { ...documentsForm, files: uploadedFilesData },
      company_id
    }, req.user);

    // 4. Send Welcome Email & Notification
    notifyEmployeeCreated({
      id: result.employee_id,
      company_id,
      branch_id: employeeForm.branch_id,
      employee_code: employeeForm.employee_code,
      full_name: employeeForm.full_name,
      email: employeeForm.email
    }, employeeForm.password);

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee_id: result.employee_id
    });

  } catch (err) {
    logger.error(MODULE_NAME, `Failed at stage: ${stage}`, err);
    
    // Cleanup S3 on failure
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(key => deleteFromS3(key).catch(e => logger.error("Cleanup failed", e)));
    }

    return res.status(err.status || 500).json({
      success: false,
      error_code: "EMPLOYEE_CREATE_FAILED",
      reason: err.message,
      failed_stage: stage
    });
  }
};

/**
 * LIST EMPLOYEES
 */
export const list_employees = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const result = await listEmployeesService(company_id, req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    logger.error(MODULE_NAME, "List employees failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET EMPLOYEE BY ID
 */
export const get_employee_by_id = async (req, res) => {
  const { id } = req.params;
  const company_id = req.user.company_id;

  try {
    const result = await getEmployeeByIdService(id, company_id);
    if (!result) return res.status(404).json({ success: false, message: "Employee not found" });
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error(MODULE_NAME, "Get employee failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * UPDATE EMPLOYEE
 */
export const update_employee = async (req, res) => {
  const { id } = req.params;
  const company_id = req.user.company_id;
  const uploadedFiles = [];

  try {
    let { employeeForm, profileForm, documentsForm } = req.body;

    try {
      if (typeof employeeForm === 'string') employeeForm = JSON.parse(employeeForm);
      if (typeof profileForm === 'string') profileForm = JSON.parse(profileForm);
      if (typeof documentsForm === 'string') documentsForm = JSON.parse(documentsForm);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid JSON in form data" });
    }

    // Map phone to phone_number if needed
    if (employeeForm && !employeeForm.phone_number && employeeForm.phone) {
      employeeForm.phone_number = employeeForm.phone;
    }

    // Fetch existing employee to get names for S3 path if not provided
    const [[existing]] = await db.query(
      `SELECT e.employee_code, b.branch_name, c.company_name, e.branch_id
       FROM ${TABLES.EMPLOYEES} e
       JOIN ${TABLES.BRANCHES} b ON b.id = e.branch_id
       JOIN ${TABLES.COMPANIES} c ON c.id = e.company_id
       WHERE e.id = ? AND e.company_id = ?`,
      [id, company_id]
    );

    if (!existing) return res.status(404).json({ success: false, message: "Employee not found" });

    const targetBranchId = employeeForm?.branch_id || existing.branch_id;
    const [[targetBranch]] = await db.query(`SELECT branch_name FROM ${TABLES.BRANCHES} WHERE id = ?`, [targetBranchId]);
    
    const branchName = targetBranch?.branch_name || existing.branch_name;
    const empCode = employeeForm?.employee_code || existing.employee_code;

    const filesArray = req.files || [];
    const uploadedFilesData = {};

    for (const file of filesArray) {
      const category = file.fieldname === 'profile_photo' ? 'profile' : 'personal';
      const fullKey = generateS3Key(existing.company_name, branchName, empCode, category, file.originalname);
      const uploadResult = await uploadToS3(file.buffer, fullKey, file.mimetype);
      
      const fileEntry = { url: uploadResult.url, key: uploadResult.key, fieldname: file.fieldname };

      if (!uploadedFilesData[file.fieldname]) uploadedFilesData[file.fieldname] = [];
      uploadedFilesData[file.fieldname].push(fileEntry);
      uploadedFiles.push(uploadResult.key);
    }

    await updateEmployeeService(id, company_id, {
      employeeForm,
      profileForm,
      documentsForm: { ...documentsForm, files: uploadedFilesData }
    }, req.user);

    // Send Update Notification
    notifyProfileUpdated({
      id,
      company_id,
      branch_id: targetBranchId,
      full_name: empCode || existing.full_name, // fallback or passed
      email: existing.email
    });

    return res.json({ success: true, message: "Employee updated successfully" });

  } catch (err) {
    logger.error(MODULE_NAME, "Failed to update employee", err);
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(key => deleteFromS3(key).catch(e => logger.error("Cleanup failed", e)));
    }
    return res.status(500).json({ success: false, message: "Internal server error", reason: err.message });
  }
};

/**
 * TOGGLE EMPLOYEE STATUS
 */
export const toggle_employee_status = async (req, res) => {
  const { id } = req.params;
  const { is_active, status } = req.body;
  const company_id = req.user.company_id;

  try {
    const shouldActivate = (status === 'ACTIVE' || is_active === true || is_active === 1);
    let success = false;

    if (shouldActivate) {
      success = await activateEmployeeService(id, company_id);
    } else {
      success = await deleteEmployeeService(id, company_id);
    }

    if (!success) return res.status(404).json({ success: false, message: "Employee not found" });

    // Send Status Change Notification
    const [[emp]] = await db.query(`SELECT email, full_name, company_id, branch_id FROM ${TABLES.EMPLOYEES} WHERE id = ?`, [id]);
    if (emp) {
      notifyStatusChanged({
        id,
        ...emp
      }, shouldActivate ? 'ACTIVE' : 'INACTIVE');
    }

    return res.json({ success: true, message: `Employee ${shouldActivate ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    logger.error(MODULE_NAME, "Toggle status failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * ACTIVATE EMPLOYEE
 */
export const activate_employee = async (req, res) => {
  const { id } = req.params;
  const company_id = req.user.company_id;

  try {
    const success = await activateEmployeeService(id, company_id);
    if (!success) return res.status(404).json({ success: false, message: "Employee not found" });
    return res.json({ success: true, message: "Employee activated successfully" });
  } catch (err) {
    logger.error(MODULE_NAME, "Activate employee failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE EMPLOYEE
 */
export const delete_employee = async (req, res) => {
  const { id } = req.params;
  const company_id = req.user.company_id;

  try {
    const deleted = await deleteEmployeeService(id, company_id);
    if (!deleted) return res.status(404).json({ success: false, message: "Employee not found" });
    return res.json({ success: true, message: "Employee deactivated successfully" });
  } catch (err) {
    logger.error(MODULE_NAME, "Delete employee failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET LAST EMPLOYEE CODE (For preview)
 */
export const getLastEmployeeCode = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { branch_id } = req.query;

    if (!branch_id) return res.status(400).json({ success: false, message: "branch_id is required" });

    const [empRows] = await db.query(
      `SELECT employee_code FROM ${TABLES.EMPLOYEES} 
       WHERE company_id = ? AND branch_id = ? 
       ORDER BY id DESC LIMIT 1`,
      [company_id, branch_id]
    );

    if (empRows.length > 0) {
      const lastCode = empRows[0].employee_code;
      const match = lastCode.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const number = match[2];
        const nextCode = prefix + String(parseInt(number, 10) + 1).padStart(number.length, "0");
        return res.json({ success: true, code: nextCode });
      }
      return res.json({ success: true, code: lastCode, note: "No numeric suffix found" });
    }

    return res.json({ success: true, code: "EMP001", note: "Starting fresh" });
  } catch (err) {
    logger.error(MODULE_NAME, "Get last code failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * UPDATE BY CODE
 */
export const update_employee_by_code = async (req, res) => {
  const { employee_code } = req.params;
  const company_id = req.user.company_id;

  try {
    const [rows] = await db.query(`SELECT id FROM ${TABLES.EMPLOYEES} WHERE employee_code = ? AND company_id = ?`, [employee_code, company_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Employee not found" });
    
    req.params.id = rows[0].id;
    return update_employee(req, res);
  } catch (err) {
    logger.error(MODULE_NAME, "Update by code failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET AVAILABLE COMPANY FORMS (Renamed to Documents)
 */
export const getAvailableCompanyForms = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const [rows] = await db.query(
      `SELECT id, document_code as form_code, document_name as form_name 
       FROM ${TABLES.COMPANY_DOCUMENTS} 
       WHERE company_id = ?`, 
      [company_id]
    );

    return res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    logger.error(MODULE_NAME, "Get available forms failed", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
