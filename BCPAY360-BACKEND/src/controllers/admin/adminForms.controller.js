import db from "../../config/db.js";
import path from "path";
import {
  uploadToS3,
  generateS3Key,
  getS3SignedUrl,
  deleteFromS3
} from "../../utils/s3.util.js";
import { S3_BUCKET_NAME } from "../../config/s3.config.js";
import logger from "../../utils/logger.js";
import dayjs from "dayjs";
const MODULE_NAME = "ADMIN_FORMS_CONTROLLER";
import { sendNotification } from "../../utils/oneSignal.js";



// export const getEmployeesByForm = async (req, res) => {
//   try {
//     const {
//       formCode,
//       periodType,
//       financialYear,
//       year,
//       month,
//       branchId,
//       departmentId
//     } = req.query;

//     /* =====================
//        VALIDATION
//     ===================== */
//     if (!formCode || !periodType) {
//       return res.status(400).json({
//         message: "formCode and periodType are required"
//       });
//     }

//     if (periodType === "FY" && !financialYear) {
//       return res.status(400).json({
//         message: "financialYear is required for FY forms"
//       });
//     }

//     if (periodType === "MONTH" && (!year || !month)) {
//       return res.status(400).json({
//         message: "year and month are required for MONTH forms"
//       });
//     }

//     const companyId = req.user.company_id;

//     /* =====================
//        JOIN CONDITIONS
//     ===================== */
//     let joinCondition = `
//       efd.employee_id = e.id
//       AND efd.form_code = ?
//       AND efd.period_type = ?
//     `;
//     const params = [formCode, periodType];

//     if (periodType === "FY") {
//       joinCondition += " AND efd.financial_year = ?";
//       params.push(financialYear);
//     } else {
//       joinCondition += " AND efd.doc_year = ? AND efd.doc_month = ?";
//       params.push(year, month);
//     }

//     /* =====================
//        WHERE CONDITIONS
//     ===================== */
//     let whereClause = `
//       WHERE e.company_id = ?
//       AND e.employee_status = 'ACTIVE'
//     `;
//     params.push(companyId);

//     if (branchId) {
//       whereClause += " AND e.branch_id = ?";
//       params.push(branchId);
//     }

//     if (departmentId) {
//       whereClause += " AND e.department_id = ?";
//       params.push(departmentId);
//     }

//     /* =====================
//        FINAL QUERY
//     ===================== */
//     const sql = `
//       SELECT
//         e.id AS employee_id,
//         e.employee_code,
//         e.full_name,
//         e.phone,
//         e.joining_date,

//         e.branch_id,
//         b.branch_name,

//         e.department_id,
//         d.department_name,

//         efd.id AS document_id,
//         efd.created_at AS uploaded_at,
//         efd.storage_object_key

//       FROM employees e

//       LEFT JOIN branches b
//         ON b.id = e.branch_id

//       LEFT JOIN departments d
//         ON d.id = e.department_id

//       LEFT JOIN employee_form_documents efd
//         ON ${joinCondition}

//       ${whereClause}
//       ORDER BY e.employee_code
//     `;

//     const [rows] = await db.query(sql, params);

//     /* =====================
//        RESPONSE BUILD
//     ===================== */
//     const available = [];
//     const missing = [];

//     for (const row of rows) {
//       if (row.document_id && row.storage_object_key) {

//         const viewUrl = await getS3SignedUrl(
//           row.storage_object_key,
//           259200,
//           { disposition: "inline" }
//         );

//         const downloadUrl = await getS3SignedUrl(
//           row.storage_object_key,
//           259200,
//           { disposition: "attachment" }
//         );

//         available.push({
//           employee_id: row.employee_id,
//           employee_code: row.employee_code,
//           full_name: row.full_name,
//           phone: row.phone,
//           joining_date: row.joining_date,

//           branch_id: row.branch_id,
//           branch_name: row.branch_name,

//           department_id: row.department_id,
//           department_name: row.department_name,

//           document_id: row.document_id,
//           uploaded_at: row.uploaded_at,

//           view_url: viewUrl,
//           download_url: downloadUrl
//         });

//       } else {
//         missing.push({
//           employee_id: row.employee_id,
//           employee_code: row.employee_code,
//           full_name: row.full_name,
//           phone: row.phone,
//           joining_date: row.joining_date,

//           branch_id: row.branch_id,
//           branch_name: row.branch_name,

//           department_id: row.department_id,
//           department_name: row.department_name,

//           document_id: null,
//           uploaded_at: null,
//           view_url: null,
//           download_url: null
//         });
//       }
//     }

//     /* =====================
//        FINAL RESPONSE
//     ===================== */
//     return res.json({
//       summary: {
//         total: rows.length,
//         available: available.length,
//         missing: missing.length
//       },
//       available,
//       missing
//     });

//   } catch (error) {
//     console.error("GET EMPLOYEE FORMS ERROR:", error);
//     return res.status(500).json({
//       message: "Internal server error"
//     });
//   }
// };


export const getEmployeesByForm = async (req, res) => {
  try {
    const {
      formCode,
      docType, // ✅ Added
      periodType,
      financialYear,
      year,
      month,
      branchId,
      departmentId
    } = req.query;

    if (!formCode || !periodType) {
      return res.status(400).json({
        message: "formCode and periodType are required"
      });
    }

    if (periodType === "FY" && !financialYear) {
      return res.status(400).json({
        message: "financialYear is required for FY forms"
      });
    }

    if (periodType === "MONTH" && (!year || !month)) {
      return res.status(400).json({
        message: "year and month are required for MONTH forms"
      });
    }

    const companyId = req.user.company_id;

    /* ===================== JOIN ===================== */
    let joinCondition = `
      efd.employee_id = e.id
      AND efd.form_code = ?
      AND efd.period_type = ?
    `;

    const params = [formCode, periodType];

    if (docType) {
      joinCondition += " AND efd.doc_type = ?";
      params.push(docType);
    }

    if (periodType === "FY") {
      joinCondition += " AND efd.financial_year = ?";
      params.push(financialYear);
    } else {
      joinCondition += " AND efd.doc_year = ? AND efd.doc_month = ?";
      params.push(year, month);
    }

    /* ===================== WHERE ===================== */
    let whereClause = `
      WHERE e.company_id = ?
      AND e.employee_status = 'ACTIVE'
    `;
    params.push(companyId);

    if (branchId) {
      whereClause += " AND e.branch_id = ?";
      params.push(branchId);
    }

    if (departmentId) {
      whereClause += " AND e.department_id = ?";
      params.push(departmentId);
    }

    /* ===================== QUERY ===================== */
    const sql = `
      SELECT
        e.id AS employee_id,
        e.employee_code,
        e.full_name,
        e.phone_number AS phone, -- FIXED
        e.joining_date,

        e.branch_id,
        b.branch_name,

        e.department_id,
        d.department_name,

        ep.profile_photo_url, -- FIXED (Was path)

        efd.id AS document_id,
        efd.created_at AS uploaded_at,
        efd.storage_object_key

      FROM employees e

      LEFT JOIN branches b ON b.id = e.branch_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
      LEFT JOIN employee_form_documents efd ON ${joinCondition}

      ${whereClause}
      ORDER BY e.employee_code
    `;

    const [rows] = await db.query(sql, params);

    /* ===================== RESPONSE BUILD ===================== */

    const results = await Promise.all(
      rows.map(async (row) => {

        /* ===========================
           IMAGE URL HANDLER
        =========================== */
        let photoKey = row.profile_photo_url;
        if (photoKey && photoKey.startsWith('http')) {
          try {
            const urlObj = new URL(photoKey);
            photoKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
          } catch (e) {
            photoKey = row.profile_photo_url;
          }
        }

        const profileImageUrl = await getS3SignedUrl(photoKey, 259200);

        const baseEmployee = {
          employee_id: row.employee_id,
          employee_code: row.employee_code,
          full_name: row.full_name,
          phone: row.phone,
          joining_date: row.joining_date,
          branch_id: row.branch_id,
          branch_name: row.branch_name,
          department_id: row.department_id,
          department_name: row.department_name,
          profile_image_url: profileImageUrl
        };

        if (row.document_id && row.storage_object_key) {

          const [viewUrl, downloadUrl] = await Promise.all([
            getS3SignedUrl(row.storage_object_key, 259200, {
              disposition: "inline"
            }),
            getS3SignedUrl(row.storage_object_key, 259200, {
              disposition: "attachment"
            })
          ]);

          return {
            type: "available",
            data: {
              ...baseEmployee,
              document_id: row.document_id,
              uploaded_at: row.uploaded_at,
              view_url: viewUrl,
              download_url: downloadUrl
            }
          };

        } else {
          return {
            type: "missing",
            data: {
              ...baseEmployee,
              document_id: null,
              uploaded_at: null,
              view_url: null,
              download_url: null
            }
          };
        }
      })
    );

    const available = results
      .filter(r => r.type === "available")
      .map(r => r.data);

    const missing = results
      .filter(r => r.type === "missing")
      .map(r => r.data);

    return res.json({
      summary: {
        total: rows.length,
        available: available.length,
        missing: missing.length
      },
      available,
      missing
    });

  } catch (error) {
    console.error("GET EMPLOYEE FORMS ERROR:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const uploadEmployeeForm = async (req, res) => {
  try {
    const {
      employeeId,
      docType, // ✅ Added (FORM or REPORT)
      formCode,
      periodType,
      financialYear,
      year,
      month
    } = req.body;

    /* =====================
       BASIC VALIDATION
    ===================== */
    if (!employeeId || !docType || !formCode || !periodType) {
      return res.status(400).json({
        message: "employeeId, docType, formCode and periodType are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Document file is required"
      });
    }

    if (periodType === "FY" && !financialYear) {
      return res.status(400).json({
        message: "financialYear is required for FY forms"
      });
    }

    if (periodType === "MONTH" && (!year || !month)) {
      return res.status(400).json({
        message: "year and month are required for MONTH forms"
      });
    }

    const uploaderRole = req.user.role;
    const uploaderId = req.user.id;

    /* =====================
       DUPLICATE CHECK
    ===================== */
    let checkSql = `
      SELECT id
      FROM employee_form_documents
      WHERE employee_id = ?
        AND form_code = ?
        AND period_type = ?
    `;
    const checkParams = [employeeId, formCode, periodType];

    if (periodType === "FY") {
      checkSql += " AND financial_year = ?";
      checkParams.push(financialYear);
    } else {
      checkSql += " AND doc_year = ? AND doc_month = ?";
      checkParams.push(year, month);
    }

    const [existing] = await db.query(checkSql, checkParams);

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Document already uploaded for this employee and period"
      });
    }

    /* =====================
       RESOLVE EMPLOYEE
    ===================== */
    const [[targetEmp]] = await db.query(
      `SELECT e.id, e.company_id, e.branch_id, e.employee_code, c.company_name, b.branch_name 
       FROM employees e
       JOIN companies c ON e.company_id = c.id
       JOIN branches b ON e.branch_id = b.id
       WHERE e.id = ? AND e.company_id = ?`,
      [employeeId, req.user.company_id]
    );

    if (!targetEmp) {
      return res.status(404).json({ message: "Target employee not found or access denied" });
    }

    /* =========================================
       BUILD S3 KEY
    ========================================= */
    const cleanCompanyName = targetEmp.company_name.toString().replace(/\s+/g, "_").toLowerCase();
    const cleanBranchName = targetEmp.branch_name.toString().replace(/\s+/g, "_").toLowerCase();
    const cleanEmpCode = targetEmp.employee_code.toString().replace(/\s+/g, "_").toUpperCase();
    
    const folderName = docType.toUpperCase() === 'FORM' ? 'forms' : 'reports';
    const docYear = periodType === "FY" ? financialYear : year;
    const cleanFileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;

    const s3Key = `${cleanCompanyName}/${cleanBranchName}/${cleanEmpCode}/${folderName}/${docYear}/${cleanFileName}`;

    /* =====================
       UPLOAD TO S3
    ===================== */
    const s3Result = await uploadToS3(
      req.file.buffer,
      s3Key,
      req.file.mimetype
    );

    /* =====================
       INSERT DB RECORD
    ===================== */
    const insertSql = `
      INSERT INTO employee_form_documents (
        employee_id,
        doc_type,
        form_code,
        period_type,
        financial_year,
        doc_year,
        doc_month,
        storage_provider,
        storage_bucket,
        storage_object_key,
        is_employee_visible,
        uploaded_by_role,
        uploaded_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      employeeId,
      docType,
      formCode,
      periodType,
      periodType === "FY" ? financialYear : null,
      periodType === "MONTH" ? year : null,
      periodType === "MONTH" ? month : null,
      "S3",
      S3_BUCKET_NAME,
      s3Result.key,
      1,
      uploaderRole,
      uploaderId
    ];

    await db.query(insertSql, insertParams);

    /* =====================
   🔔 SEND NOTIFICATION
===================== */

let periodLabel = "";

if (periodType === "FY") {
  periodLabel = `Financial Year ${financialYear}`;
} else {
  const monthName = dayjs(`${year}-${month}-01`).format("MMMM YYYY");
  periodLabel = monthName;
}

await sendNotification({
  company_id: targetEmp.company_id,
  user_type: "EMPLOYEE",
  user_id: employeeId,
  title: `${formCode.toUpperCase()} Form Uploaded`,
  message: `${formCode.toUpperCase()} document for ${periodLabel} has been uploaded and is now available for review.`,
  notification_type: "FORM_UPLOAD",
  reference_type: "EMPLOYEE_FORM",
  action_url: `/employee/forms`
});

    return res.status(201).json({
      success: true,
      message: "Form uploaded successfully"
    });

  } catch (error) {
    logger.error(MODULE_NAME, "Failed to upload employee form", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const replaceEmployeeForm = async (req, res) => {
  try {
    const {
      employeeId,
      docType, // ✅ Added
      formCode,
      periodType,
      financialYear,
      year,
      month
    } = req.body;

    if (!employeeId || !docType || !formCode || !periodType) {
      return res.status(400).json({
        message: "employeeId, docType, formCode and periodType are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Replacement document file is required"
      });
    }

    if (periodType === "FY" && !financialYear) {
      return res.status(400).json({
        message: "financialYear is required for FY forms"
      });
    }

    if (periodType === "MONTH" && (!year || !month)) {
      return res.status(400).json({
        message: "year and month are required for MONTH forms"
      });
    }

    /* =====================
       FIND EXISTING RECORD
    ===================== */
    let findSql = `
      SELECT id, storage_object_key
      FROM employee_form_documents
      WHERE employee_id = ?
        AND form_code = ?
        AND period_type = ?
    `;
    const params = [employeeId, formCode, periodType];

    if (periodType === "FY") {
      findSql += " AND financial_year = ?";
      params.push(financialYear);
    } else {
      findSql += " AND doc_year = ? AND doc_month = ?";
      params.push(year, month);
    }

    const [[existing]] = await db.query(findSql, params);

    if (!existing) {
      return res.status(404).json({
        message: "No existing document found to replace"
      });
    }

    /* =====================
       RESOLVE EMPLOYEE
    ===================== */
    const [[targetEmp]] = await db.query(
      `SELECT e.id, e.company_id, e.branch_id, e.employee_code, c.company_name, b.branch_name 
       FROM employees e
       JOIN companies c ON e.company_id = c.id
       JOIN branches b ON e.branch_id = b.id
       WHERE e.id = ? AND e.company_id = ?`,
      [employeeId, req.user.company_id]
    );

    if (!targetEmp) {
      return res.status(404).json({ message: "Target employee not found or access denied" });
    }

    /* =========================================
       BUILD S3 KEY
    ========================================= */
    const cleanCompanyName = targetEmp.company_name.toString().replace(/\s+/g, "_").toLowerCase();
    const cleanBranchName = targetEmp.branch_name.toString().replace(/\s+/g, "_").toLowerCase();
    const cleanEmpCode = targetEmp.employee_code.toString().replace(/\s+/g, "_").toUpperCase();
    
    const folderName = docType.toUpperCase() === 'FORM' ? 'forms' : 'reports';
    const docYear = periodType === "FY" ? financialYear : year;
    const cleanFileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;

    const s3Key = `${cleanCompanyName}/${cleanBranchName}/${cleanEmpCode}/${folderName}/${docYear}/${cleanFileName}`;

    /* =====================
       UPLOAD (OVERWRITE)
    ===================== */
    const s3Result = await uploadToS3(
      req.file.buffer,
      s3Key,
      req.file.mimetype
    );

    /* ==================================
       DELETE OLD (if key changed)
    ================================== */
    if (existing.storage_object_key && existing.storage_object_key !== s3Result.key) {
      await deleteFromS3(existing.storage_object_key);
    }

    /* =====================
       UPDATE DB
    ===================== */
    await db.query(
      `
      UPDATE employee_form_documents
      SET
        doc_type = ?,
        storage_object_key = ?,
        storage_bucket = ?,
        uploaded_by_role = ?,
        uploaded_by_id = ?
      WHERE id = ?
      `,
      [
        docType,
        s3Result.key,
        S3_BUCKET_NAME,
        req.user.role,
        req.user.id,
        existing.id
      ]
    );

    /* =====================
       🔔 NOTIFICATION
    ===================== */
    let periodLabel = periodType === "FY" ? `Financial Year ${financialYear}` : dayjs(`${year}-${month}-01`).format("MMMM YYYY");

    await sendNotification({
      company_id: targetEmp.company_id,
      user_type: "EMPLOYEE",
      user_id: employeeId,
      title: `${formCode.toUpperCase()} Form Updated`,
      message: `${formCode.toUpperCase()} document for ${periodLabel} has been updated.`,
      notification_type: "FORM_UPDATED",
      reference_type: "EMPLOYEE_FORM",
      action_url: `/employee/forms`
    });

    return res.json({
      success: true,
      message: "Form replaced successfully"
    });

  } catch (error) {
    logger.error(MODULE_NAME, "Failed to replace employee form", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};




export const deleteEmployeeForm = async (req, res) => {
  try {
    const {
      employeeId,
      formCode,
      periodType,
      financialYear,
      year,
      month
    } = req.body;

    if (!employeeId || !formCode || !periodType) {
      return res.status(400).json({
        message: "employeeId, formCode and periodType are required"
      });
    }

    /* =====================
       FIND DOCUMENT
    ===================== */
    let findSql = `
      SELECT id, storage_object_key
      FROM employee_form_documents
      WHERE employee_id = ?
        AND form_code = ?
        AND period_type = ?
    `;
    const params = [employeeId, formCode, periodType];

    if (periodType === "FY") {
      findSql += " AND financial_year = ?";
      params.push(financialYear);
    } else {
      findSql += " AND doc_year = ? AND doc_month = ?";
      params.push(year, month);
    }

    const [[existing]] = await db.query(findSql, params);

    if (!existing) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    /* =====================
       DELETE FROM S3
    ===================== */
    if (existing.storage_object_key) {
      await deleteFromS3(existing.storage_object_key);
    }

    /* =====================
       DELETE DB RECORD
    ===================== */
    await db.query(
      `DELETE FROM employee_form_documents WHERE id = ?`,
      [existing.id]
    );

    return res.json({
      success: true,
      message: "Form deleted successfully"
    });

  } catch (error) {
    logger.error(MODULE_NAME, "Failed to delete employee form", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};




