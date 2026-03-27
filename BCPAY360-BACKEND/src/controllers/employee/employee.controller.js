import db from "../../config/db.js";
import logger from "../../utils/logger.js";
import {
  getS3SignedUrl,
  uploadToS3,
  generateS3Key
} from "../../utils/s3.util.js";

const MODULE_NAME = "EMPLOYEE_PROFILE_UPDATE_CONTROLLER";

const SIGNED_URL_TTL = 259200; // 3 days
const INLINE = { disposition: "inline" };

/* ---------------------------------
   HELPERS
--------------------------------- */

const secondsToHMS = (seconds = 0) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const timeToSeconds = (t) => {
  if (!t) return 0;
  if (t instanceof Date) {
    return t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds();
  }
  if (typeof t === 'string' && t.includes(':')) {
    const [h, m, s = 0] = t.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  }
  return 0;
};

const extractS3Key = (value) => {
  if (!value) return null;
  if (value.startsWith("http")) {
    const url = new URL(value);
    return url.pathname.replace(/^\/+/, "");
  }
  return value;
};

/* ---------------------------------
   CONTROLLER
--------------------------------- */

export const updateEmployeeProfile = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const employeeId = req.user.id;
    const { full_name, email, country_code, phone, address, permanent_address } = req.body;

    let profilePhotoPath = null;

    /* ---------------------------------
       HANDLE PROFILE PHOTO UPLOAD
    --------------------------------- */
    if (req.file) {
      const [[empContext]] = await connection.query(
        `SELECT company_id, branch_id, employee_code 
         FROM employees WHERE id = ?`,
        [employeeId]
      );

      const s3Key = generateS3Key(
        {
          companyId: empContext.company_id,
          branchId: empContext.branch_id,
          employeeCode: empContext.employee_code
        },
        {
          fieldname: "PROFILE_PHOTO",
          originalname: req.file.originalname
        }
      );

      const { key } = await uploadToS3(
        req.file.buffer,
        s3Key,
        req.file.mimetype
      );

      profilePhotoPath = key;
    }

    await connection.beginTransaction();

    /* ---------------------------------
       VALIDATIONS
    --------------------------------- */

    const [[existingEmployee]] = await connection.query(
      `SELECT id FROM employees WHERE id = ?`,
      [employeeId]
    );

    if (!existingEmployee) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    if (email) {
      const [[duplicate]] = await connection.query(
        `SELECT id FROM employees WHERE email = ? AND id != ?`,
        [email, employeeId]
      );

      if (duplicate) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    /* ---------------------------------
       UPDATE CORE TABLE
    --------------------------------- */

    const employeeUpdateFields = [];
    const employeeUpdateValues = [];

    if (full_name !== undefined) {
      employeeUpdateFields.push("full_name = ?");
      employeeUpdateValues.push(full_name);
    }

    if (email !== undefined) {
      employeeUpdateFields.push("email = ?");
      employeeUpdateValues.push(email);
    }
    if (country_code !== undefined) {
      employeeUpdateFields.push("country_code = ?");
      employeeUpdateValues.push(country_code);
    }

    if (phone !== undefined) {
      const numericPhone = phone.replace(/\D/g, "");

      if (numericPhone.length < 8 || numericPhone.length > 15) {
        throw new Error("Invalid phone number");
      }

      employeeUpdateFields.push("phone_number = ?");
      employeeUpdateValues.push(numericPhone);
    }

    if (employeeUpdateFields.length > 0) {
      await connection.query(
        `UPDATE employees
     SET ${employeeUpdateFields.join(", ")}
     WHERE id = ?`,
        [...employeeUpdateValues, employeeId]
      );
    }

    const [[profileRow]] = await connection.query(
      `SELECT id FROM employee_profiles WHERE employee_id = ?`,
      [employeeId]
    );

    const profileUpdateFields = [];
    const profileUpdateValues = [];

    if (address !== undefined) {
      profileUpdateFields.push("address = ?");
      profileUpdateValues.push(address);
    }

    if (permanent_address !== undefined) {
      profileUpdateFields.push("permanent_address = ?");
      profileUpdateValues.push(permanent_address);
    }

    if (profilePhotoPath !== null) {
      profileUpdateFields.push("profile_photo_url = ?");
      profileUpdateValues.push(profilePhotoPath);
    }

    profileUpdateFields.push("last_updated_by = ?");
    profileUpdateValues.push(employeeId);

    if (profileRow && profileUpdateFields.length > 0) {
      await connection.query(
        `UPDATE employee_profiles
     SET ${profileUpdateFields.join(", ")}
     WHERE employee_id = ?`,
        [...profileUpdateValues, employeeId]
      );
    }

    await connection.commit();

    /* ================================================
       FROM HERE SAME AS getEmployeeProfile API
    ================================================= */

    const [[employee]] = await connection.query(
      `SELECT
        e.id AS employee_id,
        e.company_id,
        c.company_name AS company_name,
        e.employee_code,
        e.full_name,
        e.email,
        e.country_code,
        e.phone_number AS phone,
        e.employee_status,
        e.employment_status,
        e.joining_date,
        d.department_name,
        b.branch_name,
        g.designation_name,
        ep.gender,
        ep.dob,
        ep.religion,
        ep.father_name,
        ep.marital_status,
        ep.qualification,
        ep.emergency_contact,
        ep.address,
        ep.permanent_address,
        ep.bank_name,
        ep.account_number,
        ep.ifsc_code,
        ep.bank_branch_name,
        ep.profile_photo_url AS profile_photo_path
      FROM employees e
      JOIN companies c ON c.id = e.company_id
      JOIN departments d ON d.id = e.department_id
      JOIN branches b ON b.id = e.branch_id
      JOIN designations g ON g.id = e.designation_id
      LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
      WHERE e.id = ?`,
      [employeeId]
    );

    const profilePhotoKey = extractS3Key(employee.profile_photo_path);
    const profile_photo_url = profilePhotoKey
      ? await getS3SignedUrl(profilePhotoKey, SIGNED_URL_TTL, INLINE)
      : null;

    /* PERSONAL DOCUMENTS */

    const [documentRows] = await connection.query(
      `SELECT id, document_type, document_number,
              file_url, created_at
       FROM employee_documents
       WHERE employee_id = ?`,
      [employeeId]
    );

    const personal_documents = await Promise.all(
      documentRows.map(async (doc) => {
        const key = extractS3Key(doc.file_url);
        return {
          id: doc.id,
          document_type: doc.document_type,
          document_number: doc.document_number,
          created_at: doc.created_at,
          view_url: key
            ? await getS3SignedUrl(key, SIGNED_URL_TTL, INLINE)
            : null,
          download_url: key
            ? await getS3SignedUrl(key, SIGNED_URL_TTL, {
              disposition: `attachment; filename="${doc.document_type}.pdf"`
            })
            : null
        };
      })
    );

    /* FORM DOCUMENTS */

    const [formRows] = await connection.query(
      `SELECT form_code, period_type, financial_year,
              doc_year, doc_month, storage_object_key,
              uploaded_by_role, created_at
       FROM employee_form_documents
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [employeeId]
    );

    const form_documents = await Promise.all(
      formRows.map(async (doc) => {
        const key = extractS3Key(doc.storage_object_key);
        const periodLabel =
          doc.period_type === "MONTH"
            ? `${doc.doc_year}-${String(doc.doc_month).padStart(2, "0")}`
            : doc.financial_year || "NA";

        return {
          form_code: doc.form_code,
          period_type: doc.period_type,
          financial_year: doc.financial_year,
          doc_year: doc.doc_year,
          doc_month: doc.doc_month,
          uploaded_by_role: doc.uploaded_by_role,
          uploaded_at: doc.created_at,
          view_url: key
            ? await getS3SignedUrl(key, SIGNED_URL_TTL, INLINE)
            : null,
          download_url: key
            ? await getS3SignedUrl(key, SIGNED_URL_TTL, {
              disposition: `attachment; filename="${doc.form_code}_${periodLabel}.pdf"`
            })
            : null
        };
      })
    );

    /* ATTENDANCE */

    const [[attendance]] = await connection.query(
      `SELECT a.attendance_date, a.check_in_time,
              a.check_out_time, a.work_minutes, a.is_late, a.overtime_minutes,
              s.start_time AS shift_start, s.end_time AS shift_end,
              a.status, a.session_status = 1 AS is_checked_in_session
       FROM attendance a
       JOIN shifts s ON s.id = a.shift_id
       WHERE a.employee_id = ?
         AND a.attendance_date = CURDATE()
       LIMIT 1`,
      [employeeId]
    );

    let todayStatus = "NOT_MARKED";
    if (attendance) {
      if (attendance.status === 0) todayStatus = "ABSENT";
      else if (attendance.check_in_time && !attendance.check_out_time)
        todayStatus = "CHECKED_IN";
      else if (attendance.check_in_time && attendance.check_out_time)
        todayStatus = "CHECKED_OUT";
      else {
        const STATUS_MAP = {0: "ABSENT", 1: "PRESENT", 2: "LATE", 3: "HALF_DAY", 4: "LATE_PRESENT"};
        todayStatus = STATUS_MAP[attendance.status] !== undefined ? STATUS_MAP[attendance.status] : "NOT_MARKED";
      }
    }

    /* WORK METRICS */

    let workMetrics = null;

    if (attendance?.check_in_time && attendance.shift_start && attendance.shift_end) {
      const checkInSec = timeToSeconds(attendance.check_in_time);
      const checkOutSec = attendance.check_out_time
        ? timeToSeconds(attendance.check_out_time)
        : timeToSeconds(new Date().toLocaleTimeString("en-GB"));

      const shiftStartSec = timeToSeconds(attendance.shift_start);
      const shiftEndSec = timeToSeconds(attendance.shift_end);

      const lateMins = Math.max(0, Math.floor((checkInSec - shiftStartSec) / 60));
      const earlyMins = attendance.check_out_time
        ? Math.max(0, Math.floor((shiftEndSec - checkOutSec) / 60))
        : 0;

      workMetrics = {
        shift_duration: secondsToHMS(shiftEndSec - shiftStartSec),
        worked_duration: secondsToHMS(checkOutSec - checkInSec),
        late_login_minutes: lateMins,
        formatted_late_login: `${Math.floor(lateMins / 60)}h ${lateMins % 60}m`,
        early_logout_minutes: earlyMins,
        formatted_early_logout: `${Math.floor(earlyMins / 60)}h ${earlyMins % 60}m`,
        total_working_time: secondsToHMS(checkOutSec - checkInSec)
      };
    }

    /* LEAVE SUMMARY */

    const [leaveRows] = await connection.query(
      `SELECT lm.leave_name, lm.annual_quota,
              IFNULL(SUM(lr.total_days), 0) AS used_days
       FROM leave_types lm
       LEFT JOIN employee_leave_requests lr
         ON lr.leave_type_id = lm.id
         AND lr.employee_id = ?
         AND lr.status = 'APPROVED'
         AND YEAR(lr.from_date) = YEAR(CURDATE())
       WHERE lm.is_active = 1
       GROUP BY lm.id`,
      [employeeId]
    );

    const leave_summary = leaveRows.map(l => ({
      leave_type: l.leave_name,
      total: Number(l.annual_quota),
      used: Number(l.used_days),
      remaining: Math.max(l.annual_quota - l.used_days, 0)
    }));

    /* FINAL RESPONSE */

    return res.json({
      success: true,
      message: "Profile updated successfully",
      employee: {
        employee_id: employee.employee_id,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        email: employee.email,
        country_code: employee.country_code,
        phone: employee.phone,
        company_id: employee.company_id,
        company_name: employee.company_name,
        employee_status: employee.employee_status,
        employment_status: employee.employment_status,
        joining_date: employee.joining_date ? new Date(employee.joining_date).toISOString().slice(0, 10) : null,
        department: employee.department_name,
        branch: employee.branch_name,
        designation: employee.designation_name,
        gender: employee.gender,
        dob: employee.dob ? new Date(employee.dob).toISOString().slice(0, 10) : null,
        religion: employee.religion,
        father_name: employee.father_name,
        marital_status: employee.marital_status,
        qualification: employee.qualification,
        emergency_contact: employee.emergency_contact,
        address: employee.address,
        permanent_address: employee.permanent_address,
        bank_name: employee.bank_name,
        account_number: employee.account_number,
        ifsc_code: employee.ifsc_code,
        bank_branch_name: employee.bank_branch_name,
        profile_photo_url,
        personal_documents,
        form_documents
      },
      attendance_status: {
        today_status: todayStatus,
        raw_status: attendance?.status !== undefined ? {0: "ABSENT", 1: "PRESENT", 2: "LATE", 3: "HALF_DAY"}[attendance.status] || "UNMARKED" : "NOT_MARKED",
        check_in_time: attendance?.check_in_time || null,
        check_out_time: attendance?.check_out_time || null,
        is_checked_in_session: !!attendance?.is_checked_in_session,
        is_late: attendance?.is_late || 0,
        worked_minutes: attendance?.work_minutes || 0,
        formatted_worked_time: attendance ? `${Math.floor((attendance.work_minutes || 0) / 60)}h ${(attendance.work_minutes || 0) % 60}m` : "0h 0m",
        overtime_minutes: attendance?.overtime_minutes || 0,
        formatted_overtime: attendance ? `${Math.floor((attendance.overtime_minutes || 0) / 60)}h ${(attendance.overtime_minutes || 0) % 60}m` : "0h 0m"
      },
      work_metrics: workMetrics,
      leave_summary
    });

  } catch (err) {
    await connection.rollback();
    logger.error(MODULE_NAME, "Profile update failed", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  } finally {
    connection.release();
  }
};



