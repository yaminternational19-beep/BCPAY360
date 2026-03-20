import db from "../config/db.js";
import { TABLES } from "../utils/tableNames.js";
import {
  getS3SignedUrl
} from "../utils/s3.util.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

const MODULE_NAME = "EMPLOYEE_SERVICE";
const SIGNED_URL_TTL = 259200; // 3 days
const INLINE = { disposition: "inline" };

dotenv.config();

/**
 * CREATE EMPLOYEE SERVICE
 */
export const createEmployeeService = async (employeeData, reqUser) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { employeeForm, profileForm, documentsForm, company_id } = employeeData;

    /* ===============================
       1. INSERT EMPLOYEE
    =============================== */
    const [empResult] = await conn.query(
      `INSERT INTO ${TABLES.EMPLOYEES} (
        company_id, branch_id, department_id, designation_id,
        employee_code, full_name, email, country_code, phone_number,
        employee_status, employment_status, employee_type_id, shift_id,
        joining_date, confirmation_date, notice_period_days,
        experience_years, salary, ctc_annual, is_salary_confidential,
        job_location, site_location, reporting_manager_id,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id,
        employeeForm.branch_id,
        employeeForm.department_id,
        employeeForm.designation_id,
        employeeForm.employee_code,
        employeeForm.full_name,
        employeeForm.email || null,
        employeeForm.country_code || '+91',
        employeeForm.phone_number || null,
        employeeForm.employee_status || "ACTIVE",
        employeeForm.employment_status || "ACTIVE",
        employeeForm.employee_type_id || null,
        employeeForm.shift_id || null,
        employeeForm.joining_date,
        employeeForm.confirmation_date || null,
        employeeForm.notice_period_days || null,
        employeeForm.experience_years || null,
        employeeForm.salary || null,
        employeeForm.ctc_annual || null,
        employeeForm.is_salary_confidential ?? 1,
        employeeForm.job_location || null,
        employeeForm.site_location || null,
        employeeForm.reporting_manager_id || null,
        reqUser.id
      ]
    );

    const employee_id = empResult.insertId;

    /* ===============================
       2. AUTH TABLE
    =============================== */
    await conn.query(
      `INSERT INTO ${TABLES.EMPLOYEE_AUTH} (employee_id, password_hash) VALUES (?, ?)`,
      [employee_id, employeeForm.password_hash]
    );

    /* ===============================
       3. PROFILE TABLE
    =============================== */
    await conn.query(
      `INSERT INTO ${TABLES.EMPLOYEE_PROFILES} (
        employee_id, gender, dob, religion, father_name, marital_status,
        qualification, emergency_country_code, emergency_contact,
        aadhaar_number, pan_number, uan_number, esic_number,
        address, permanent_address,
        bank_name, account_number, ifsc_code, bank_branch_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        profileForm.gender || null,
        profileForm.dob || null,
        profileForm.religion || null,
        profileForm.father_name || null,
        profileForm.marital_status || null,
        profileForm.qualification || null,
        profileForm.emergency_country_code || null,
        profileForm.emergency_contact || null,
        profileForm.aadhaar_number || null,
        profileForm.pan_number || null,
        profileForm.uan_number || null,
        profileForm.esic_number || null,
        profileForm.address || null,
        profileForm.permanent_address || null,
        profileForm.bank_name || null,
        profileForm.account_number || null,
        profileForm.ifsc_code || null,
        profileForm.bank_branch_name || null
      ]
    );

    /* ===============================
       4. DOCUMENT HANDLING
    =============================== */
    const uploadedFilesMap = documentsForm?.files || {};

    for (const [docType, files] of Object.entries(uploadedFilesMap)) {
      if (!Array.isArray(files)) continue;

      for (const file of files) {
        if (!file?.url) continue;

        if (docType === "profile_photo") {
          await conn.query(
            `UPDATE ${TABLES.EMPLOYEE_PROFILES} SET profile_photo_url = ? WHERE employee_id = ?`,
            [file.url, employee_id]
          );
        } else {
          await conn.query(
            `INSERT INTO ${TABLES.EMPLOYEE_DOCUMENTS} (
              employee_id, document_type, document_number,
              file_url, is_employee_visible, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              employee_id,
              docType,
              documentsForm[docType] || null,
              file.url,
              documentsForm.is_employee_visible || 0,
              reqUser.id
            ]
          );
        }
      }
    }

    await conn.commit();
    return { employee_id };

  } catch (err) {
    await conn.rollback();
    logger.error(MODULE_NAME, "Failed to create employee service", err);
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Helper to sign URLs safely
 */
const signUrl = async (storedUrl) => {
  if (!storedUrl) return null;
  try {
    // Extract key from https://bucket.s3.region.amazonaws.com/key
    const key = storedUrl.split('.com/')[1];
    if (!key) return storedUrl;
    return await getS3SignedUrl(key, SIGNED_URL_TTL, INLINE);
  } catch (err) {
    return storedUrl;
  }
};

/**
 * LIST EMPLOYEES SERVICE
 */
export const listEmployeesService = async (company_id, query = {}) => {
  const {
    branch_id, department_id, designation_id, shift_id,
    employee_type_id, search = "", status,
    limit = 10, offset = 0,
  } = query;

  const where = ["e.company_id = ?"];
  const params = [company_id];

  if (branch_id) { where.push("e.branch_id = ?"); params.push(branch_id); }
  if (department_id) { where.push("e.department_id = ?"); params.push(department_id); }
  if (designation_id) { where.push("e.designation_id = ?"); params.push(designation_id); }
  if (shift_id) { where.push("e.shift_id = ?"); params.push(shift_id); }
  if (employee_type_id) { where.push("e.employee_type_id = ?"); params.push(employee_type_id); }
  if (status) { where.push("e.employee_status = ?"); params.push(status); }

  if (search) {
    where.push("(e.employee_code LIKE ? OR e.full_name LIKE ? OR e.email LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const sql = `
    SELECT
      e.*,
      b.branch_name, d.department_name, dg.designation_name,
      s.shift_name, et.type_name AS employee_type_name,
      p.profile_photo_url
    FROM ${TABLES.EMPLOYEES} e
    LEFT JOIN ${TABLES.EMPLOYEE_PROFILES} p ON p.employee_id = e.id
    LEFT JOIN ${TABLES.BRANCHES} b ON b.id = e.branch_id
    LEFT JOIN ${TABLES.DEPARTMENTS} d ON d.id = e.department_id
    LEFT JOIN ${TABLES.DESIGNATIONS} dg ON dg.id = e.designation_id
    LEFT JOIN ${TABLES.SHIFTS} s ON s.id = e.shift_id
    LEFT JOIN ${TABLES.EMPLOYEE_TYPES} et ON et.id = e.employee_type_id
    WHERE ${where.join(" AND ")}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(sql, [...params, Number(limit), Number(offset)]);
  const [[countRow]] = await db.query(`SELECT COUNT(*) AS total FROM ${TABLES.EMPLOYEES} e WHERE ${where.join(" AND ")}`, params);

  // Sign profile photos
  for (const row of rows) {
    row.profile_photo_url = await signUrl(row.profile_photo_url);
  }

  return {
    rows,
    total: countRow.total,
    limit: Number(limit),
    offset: Number(offset),
  };
};

/**
 * GET EMPLOYEE BY ID SERVICE
 */
export const getEmployeeByIdService = async (id, company_id) => {
  const sql = `
    SELECT 
      e.*, 
      p.gender, p.dob, p.religion, p.father_name, p.marital_status, 
      p.qualification, p.emergency_country_code, p.emergency_contact,
      p.aadhaar_number, p.pan_number, p.uan_number, p.esic_number,
      p.address, p.permanent_address, p.bank_name, p.account_number,
      p.ifsc_code, p.bank_branch_name, p.profile_photo_url, p.last_updated_by,
      
      ea.is_active, ea.last_login_at, ea.is_account_locked,
      
      b.branch_name, d.department_name, dg.designation_name,
      s.shift_name, et.type_name AS employee_type_name
      
    FROM ${TABLES.EMPLOYEES} e
    LEFT JOIN ${TABLES.EMPLOYEE_PROFILES} p ON p.employee_id = e.id
    LEFT JOIN ${TABLES.EMPLOYEE_AUTH} ea ON ea.employee_id = e.id
    LEFT JOIN ${TABLES.BRANCHES} b ON b.id = e.branch_id
    LEFT JOIN ${TABLES.DEPARTMENTS} d ON d.id = e.department_id
    LEFT JOIN ${TABLES.DESIGNATIONS} dg ON dg.id = e.designation_id
    LEFT JOIN ${TABLES.SHIFTS} s ON s.id = e.shift_id
    LEFT JOIN ${TABLES.EMPLOYEE_TYPES} et ON et.id = e.employee_type_id
    WHERE e.id = ? AND e.company_id = ?
    LIMIT 1
  `;

  const [[row]] = await db.query(sql, [id, company_id]);
  if (!row) return null;

  // Sign profile photo
  row.profile_photo_url = await signUrl(row.profile_photo_url);

  // 1. Core Documents (Personal/Statutory)
  const [documents] = await db.query(
    `SELECT ed.*, cd.document_name 
     FROM ${TABLES.EMPLOYEE_DOCUMENTS} ed
     LEFT JOIN ${TABLES.COMPANY_DOCUMENTS} cd ON cd.document_code = ed.document_type
     WHERE ed.employee_id = ?`, 
    [id]
  );
  
  // Sign core documents
  for (const doc of documents) {
    doc.file_url = await signUrl(doc.file_url);
    // Use friendly name if available
    if (doc.document_name) {
      doc.friendly_name = doc.document_name;
    }
  }

  // 2. Periodic Form Documents (FY/MONTH based)
  let [formDocs] = await db.query(
    `SELECT * FROM ${TABLES.EMPLOYEE_FORM_DOCUMENTS} WHERE employee_id = ?`, 
    [id]
  );

  // Sign form documents
  for (const doc of formDocs) {
    if (doc.storage_object_key) {
      doc.view_url = await getS3SignedUrl(doc.storage_object_key, SIGNED_URL_TTL, INLINE);
    } else if (doc.file_url) {
      doc.view_url = await signUrl(doc.file_url);
    }
    doc.download_url = doc.view_url;
  }

  return { 
    employee: row, 
    upload: documents, // user specifically called this 'upload'
    form_documents: formDocs 
  };
};

/**
 * UPDATE EMPLOYEE SERVICE
 */
export const updateEmployeeService = async (id, company_id, updateData, reqUser) => {
  const { employeeForm, profileForm, documentsForm } = updateData;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Update Employees
    if (employeeForm && Object.keys(employeeForm).length > 0) {
      const fields = [];
      const values = [];
      const allowed = [
        'branch_id', 'department_id', 'designation_id', 'full_name', 'email',
        'country_code', 'phone_number', 'employee_status', 'employment_status',
        'employee_type_id', 'shift_id', 'joining_date', 'confirmation_date',
        'notice_period_days', 'experience_years', 'salary', 'ctc_annual',
        'is_salary_confidential', 'job_location', 'site_location', 'reporting_manager_id'
      ];

      allowed.forEach(f => {
        if (employeeForm[f] !== undefined) {
          fields.push(`${f} = ?`);
          values.push(employeeForm[f]);
        }
      });

      if (fields.length > 0) {
        await conn.query(`UPDATE ${TABLES.EMPLOYEES} SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`, [...values, id, company_id]);
      }
    }

    // 2. Update Profile
    if (profileForm && Object.keys(profileForm).length > 0) {
      const pFields = [];
      const pValues = [];
      const pAllowed = [
        'gender', 'dob', 'religion', 'father_name', 'marital_status',
        'qualification', 'emergency_country_code', 'emergency_contact',
        'address', 'permanent_address', 'bank_name', 'account_number',
        'ifsc_code', 'bank_branch_name', 'profile_photo_url'
      ];

      pAllowed.forEach(f => {
        if (profileForm[f] !== undefined) {
          pFields.push(`${f} = ?`);
          pValues.push(profileForm[f]);
        }
      });

      if (pFields.length > 0) {
        await conn.query(`UPDATE ${TABLES.EMPLOYEE_PROFILES} SET ${pFields.join(', ')} WHERE employee_id = ?`, [...pValues, id]);
      }
    }

    // 3. Update Documents (Upsert style based on type)
    if (documentsForm?.files) {
      for (const [type, files] of Object.entries(documentsForm.files)) {
        for (const file of files) {
          if (type === 'profile_photo') {
             await conn.query(`UPDATE ${TABLES.EMPLOYEE_PROFILES} SET profile_photo_url = ? WHERE employee_id = ?`, [file.url, id]);
          } else {
            await conn.query(
              `INSERT INTO ${TABLES.EMPLOYEE_DOCUMENTS} (employee_id, document_type, file_url, uploaded_by)
               VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE file_url = VALUES(file_url), uploaded_by = VALUES(uploaded_by)`,
              [id, type, file.url, reqUser.id]
            );
          }
        }
      }
    }

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    logger.error(MODULE_NAME, "Update employee service failed", err);
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * TOGGLE STATUS (SOFT DELETE)
 */
export const deleteEmployeeService = async (id, company_id) => {
  const [res] = await db.query(`UPDATE ${TABLES.EMPLOYEES} SET employee_status = 'INACTIVE' WHERE id = ? AND company_id = ?`, [id, company_id]);
  return res.affectedRows > 0;
};

/**
 * ACTIVATE EMPLOYEE
 */
export const activateEmployeeService = async (id, company_id) => {
  const [res] = await db.query(`UPDATE ${TABLES.EMPLOYEES} SET employee_status = 'ACTIVE' WHERE id = ? AND company_id = ?`, [id, company_id]);
  return res.affectedRows > 0;
};
