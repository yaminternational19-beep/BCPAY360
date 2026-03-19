import db, { dbExec } from "../../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt.js";
import { TABLES } from "../../utils/tableNames.js";
import { sendSystemEmail } from "../../mail/index.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "HR_CONTROLLER";

/* =====================================================
   CREATE HR (COMPANY ADMIN)
 ===================================================== */
export const createHR = async (req, res) => {
  const {
    branch_id,
    hr_code,
    full_name,
    email,
    country_code,
    phone_number,
    password,

    joining_date,
    experience_years,
    job_location,
    gender,
    dob,
    emergency_contact_name,
    emergency_country_code,
    emergency_contact_number,
    remarks,
  } = req.body;

  const { company_id, id: admin_id } = req.user;

  /* =========================
     1️⃣ BASIC VALIDATION
  ========================= */
  if (
    !branch_id ||
    !hr_code ||
    !full_name ||
    !email ||
    !country_code ||
    !phone_number ||
    !password ||
    !joining_date
  ) {
    return res.status(400).json({
      message: "Required fields are missing: branch_id, hr_code, full_name, email, country_code, phone_number, password, joining_date",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  try {
    /* =========================
       2️⃣ VALIDATE BRANCH
    ========================= */
    const branchSql = `
      SELECT id FROM ${TABLES.BRANCHES}
      WHERE id = ? AND company_id = ? AND is_active = 1
      LIMIT 1
    `;
    const branch = await dbExec(db, branchSql, [branch_id, company_id]);
    if (!branch.length) {
      return res.status(400).json({ message: "Invalid branch for this company" });
    }

    /* =========================
       3️⃣ DUPLICATE CHECK
    ========================= */
    const dupSql = `
      SELECT id FROM ${TABLES.HR_USERS}
      WHERE company_id = ?
        AND (
          hr_code = ?
          OR email = ?
          OR (country_code = ? AND phone_number = ?)
        )
      LIMIT 1
    `;

    const dup = await dbExec(db, dupSql, [
      company_id,
      hr_code.trim(),
      email.toLowerCase(),
      country_code,
      phone_number,
    ]);

    if (dup.length) {
      return res.status(409).json({
        message: "HR already exists with this HR code, email, or phone number",
      });
    }

    /* =========================
       4️⃣ CREATE HR
    ========================= */
    const password_hash = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO ${TABLES.HR_USERS} (
        company_id, branch_id, hr_code, full_name, email,
        country_code, phone_number, password_hash, role,
        joining_date, experience_years, job_location, gender,
        dob, emergency_contact_name, emergency_country_code, emergency_contact_number,
        remarks, created_by
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const result = await dbExec(db, insertSql, [
      company_id,
      branch_id,
      hr_code.trim().toUpperCase(),
      full_name.trim(),
      email.toLowerCase(),
      country_code,
      phone_number,
      password_hash,
      "HR",
      joining_date,
      experience_years || null,
      job_location || null,
      gender || null,
      dob || null,
      emergency_contact_name || null,
      emergency_country_code || null,
      emergency_contact_number || null,
      remarks || null,
      admin_id,
    ]);

    return res.status(201).json({
      success: true,
      id: result.insertId,
      hr_code: hr_code.trim().toUpperCase(),
      message: "HR created successfully",
    });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to create HR", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   UPDATE HR (COMPANY ADMIN)
 ===================================================== */
export const updateHR = async (req, res) => {
  const { id } = req.params;
  const {
    branch_id,
    full_name,
    email,
    country_code,
    phone_number,
    password,

    joining_date,
    experience_years,
    job_location,
    gender,
    dob,
    emergency_contact_name,
    emergency_country_code,
    emergency_contact_number,
    remarks,
    is_active,
  } = req.body;

  const { company_id } = req.user;

  if (!id) {
    return res.status(400).json({ message: "HR ID is required" });
  }

  try {
    /* =========================
       1️⃣ FETCH EXISTING HR
    ========================= */
    const hrRows = await dbExec(db, `SELECT * FROM ${TABLES.HR_USERS} WHERE id = ? AND company_id = ? LIMIT 1`, [id, company_id]);
    if (!hrRows.length) {
      return res.status(404).json({ message: "HR not found" });
    }
    const existing = hrRows[0];

    /* =========================
       2️⃣ DUPLICATE CHECK
    ========================= */
    if (email || (country_code && phone_number)) {
      const dupCheckSql = `
        SELECT id FROM ${TABLES.HR_USERS}
        WHERE company_id = ?
          AND (email = ? OR (country_code = ? AND phone_number = ?))
          AND id != ?
        LIMIT 1
      `;
      const dup = await dbExec(db, dupCheckSql, [
        company_id,
        email?.toLowerCase() || existing.email,
        country_code || existing.country_code,
        phone_number || existing.phone_number,
        id
      ]);

      if (dup.length) {
        return res.status(409).json({ message: "Another HR already exists with this email or phone" });
      }
    }

    /* =========================
       3️⃣ BUILD UPDATE
    ========================= */
    let updateSql = `
      UPDATE ${TABLES.HR_USERS}
      SET
        branch_id = ?,
        full_name = ?,
        email = ?,
        country_code = ?,
        phone_number = ?,
        joining_date = ?,
        experience_years = ?,
        job_location = ?,
        gender = ?,
        dob = ?,
        emergency_contact_name = ?,
        emergency_country_code = ?,
        emergency_contact_number = ?,
        remarks = ?,
        is_active = ?
    `;

    const values = [
      branch_id ?? existing.branch_id,
      full_name?.trim() ?? existing.full_name,
      email?.toLowerCase() ?? existing.email,
      country_code ?? existing.country_code,
      phone_number ?? existing.phone_number,
      joining_date ?? existing.joining_date,
      experience_years ?? existing.experience_years,
      job_location ?? existing.job_location,
      gender ?? existing.gender,
      dob ?? existing.dob,
      emergency_contact_name ?? existing.emergency_contact_name,
      emergency_country_code ?? existing.emergency_country_code,
      emergency_contact_number ?? existing.emergency_contact_number,
      remarks ?? existing.remarks,
      is_active ?? existing.is_active,
    ];

    if (password) {
      if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
      const password_hash = await bcrypt.hash(password, 10);
      updateSql += `, password_hash = ?, force_password_reset = 1`;
      values.push(password_hash);
    }

    updateSql += ` WHERE id = ? AND company_id = ?`;
    values.push(id, company_id);

    await dbExec(db, updateSql, values);

    return res.json({ success: true, message: "HR updated successfully" });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to update HR", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   LIST HRs
 ===================================================== */
export const listHRs = async (req, res) => {
  try {
    const { company_id } = req.user;

    const sql = `
      SELECT
        h.id, h.company_id, h.branch_id, h.hr_code, h.role,
        h.full_name, h.email, h.country_code, h.phone_number,
        h.gender, h.dob, h.joining_date, h.experience_years,
        h.job_location, h.emergency_contact_name, h.emergency_country_code,
        h.emergency_contact_number, h.remarks, h.is_active,
        h.force_password_reset, h.last_login_at,
        h.created_at, h.updated_at, b.branch_name
      FROM ${TABLES.HR_USERS} h
      JOIN ${TABLES.BRANCHES} b ON b.id = h.branch_id
      WHERE h.company_id = ?
      ORDER BY h.created_at DESC
    `;

    const rows = await dbExec(db, sql, [company_id]);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to list HRs", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   GET HR BY ID
===================================================== */
export const getHRById = async (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  try {
    const sql = `
      SELECT
        id, company_id, branch_id, hr_code, role,
        full_name, email, country_code, phone_number,
        gender, dob, joining_date, experience_years,
        job_location, emergency_contact_name, emergency_country_code,
        emergency_contact_number, remarks, is_active,
        force_password_reset, last_login_at,
        created_at, updated_at
      FROM ${TABLES.HR_USERS}
      WHERE id = ? AND company_id = ?
      LIMIT 1
    `;

    const rows = await dbExec(db, sql, [id, company_id]);

    if (!rows.length) {
      return res.status(404).json({ message: "HR not found" });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to get HR by ID", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   TOGGLE HR STATUS
===================================================== */
export const toggleHRStatus = async (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  try {
    const result = await dbExec(db, `UPDATE ${TABLES.HR_USERS} SET is_active = NOT is_active WHERE id = ? AND company_id = ?`, [id, company_id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "HR not found" });
    }

    return res.json({ success: true, message: "Status toggled" });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to toggle HR status", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   DELETE HR
===================================================== */
export const deleteHR = async (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;

  try {
    const result = await dbExec(db, `DELETE FROM ${TABLES.HR_USERS} WHERE id = ? AND company_id = ?`, [id, company_id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "HR not found" });
    }

    return res.json({ success: true, message: "HR deleted" });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to delete HR", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   HR PRE LOGIN (Modified for hr_code)
===================================================== */
export const hrPreLogin = async (req, res) => {
  const { company_id, hr_code, password } = req.body;

  if (!company_id || !hr_code || !password) {
    return res.status(400).json({ message: "Missing credentials (company_id, hr_code, password)" });
  }

  try {
    /* 1️⃣ Fetch HR */
    const sql = `
      SELECT id, email, password_hash, is_active
      FROM ${TABLES.HR_USERS}
      WHERE hr_code = ? AND company_id = ?
      LIMIT 1
    `;

    const rows = await dbExec(db, sql, [hr_code, company_id]);

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const hr = rows[0];

    if (!hr.is_active) {
      return res.status(403).json({ message: "HR account disabled" });
    }

    const isMatch = await bcrypt.compare(password, hr.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    /* 2️⃣ Invalidate previous OTPs */
    await dbExec(db, `UPDATE ${TABLES.AUTH_OTPS} SET is_used = 1 WHERE user_type = 'HR' AND user_id = ? AND is_used = 0`, [hr.id]);

    /* 3️⃣ Generate OTP */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    /* 4️⃣ Store OTP */
    const insertSql = `
      INSERT INTO ${TABLES.AUTH_OTPS} (user_type, user_id, email, otp_hash, expires_at)
      VALUES ('HR', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
    `;

    const result = await dbExec(db, insertSql, [hr.id, hr.email, otpHash]);

    /* 5️⃣ Send OTP Email */
    sendSystemEmail({
      to: hr.email,
      subject: "HR Login OTP",
      body: `Your login OTP is <strong>${otp}</strong>. It is valid for 5 minutes.`
    }).catch(err => logger.error(MODULE_NAME, "Failed to send HR OTP email", err));

    return res.json({
      success: true,
      tempLoginId: result.insertId,
      email: hr.email,
      message: "OTP sent to registered email",
    });

  } catch (err) {
    logger.error(MODULE_NAME, "HR pre-login failed", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   HR VERIFY OTP
===================================================== */
export const hrVerifyOtp = async (req, res) => {
  const { tempLoginId, otp, action = "VERIFY" } = req.body;

  if (!tempLoginId) {
    return res.status(400).json({ message: "Missing login reference" });
  }

  try {
    /* 1️⃣ Fetch OTP (Check expiry in SQL) */
    const otpSql = `
      SELECT * FROM ${TABLES.AUTH_OTPS}
      WHERE id = ? AND user_type = 'HR' AND is_used = 0 AND expires_at > NOW()
      LIMIT 1
    `;
    const otpRows = await dbExec(db, otpSql, [tempLoginId]);

    if (!otpRows.length) {
      return res.status(401).json({ message: "Session expired or invalid OTP" });
    }

    const otpRecord = otpRows[0];

    /* ==========================
       🔁 RESEND OTP
    ========================== */
    if (action === "RESEND") {
      await dbExec(db, `UPDATE ${TABLES.AUTH_OTPS} SET is_used = 1 WHERE id = ?`, [otpRecord.id]);

      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newOtpHash = await bcrypt.hash(newOtp, 10);

      const result = await dbExec(db, `INSERT INTO ${TABLES.AUTH_OTPS} (user_type, user_id, email, otp_hash, expires_at) VALUES ('HR', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`, [otpRecord.user_id, otpRecord.email, newOtpHash]);

      sendSystemEmail({
        to: otpRecord.email,
        subject: "HR Login OTP",
        body: `Your new OTP is <strong>${newOtp}</strong>.`
      }).catch(err => logger.error(MODULE_NAME, "Resend OTP email failed", err));

      return res.json({ success: true, tempLoginId: result.insertId, message: "OTP resent successfully" });
    }

    /* ==========================
       ✅ VERIFY OTP
    ========================== */
    if (!otp) return res.status(400).json({ message: "OTP required" });

    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) return res.status(401).json({ message: "Invalid OTP" });

    await dbExec(db, `UPDATE ${TABLES.AUTH_OTPS} SET is_used = 1 WHERE id = ?`, [otpRecord.id]);

    /* Fetch HR details */
    const hrRows = await dbExec(db, `SELECT id, hr_code, company_id, branch_id FROM ${TABLES.HR_USERS} WHERE id = ? LIMIT 1`, [otpRecord.user_id]);
    const hr = hrRows[0];

    const token = generateToken({
      id: hr.id,
      role: "HR",
      company_id: hr.company_id,
      branch_id: hr.branch_id
    });

    await dbExec(db, `UPDATE ${TABLES.HR_USERS} SET last_login_at = NOW() WHERE id = ?`, [hr.id]);

    return res.json({
      success: true,
      token,
      hr_code: hr.hr_code,
      company_id: hr.company_id,
      branch_id: hr.branch_id
    });

  } catch (err) {
    logger.error(MODULE_NAME, "HR verify OTP failed", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
