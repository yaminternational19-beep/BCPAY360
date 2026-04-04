import db, { dbExec } from "../../../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../../../utils/jwt.js";
import { TABLES } from "../../../utils/tableNames.js";
import { sendSystemEmail } from "../../../mail/index.js";
import logger from "../../../utils/logger.js";

const MODULE_NAME = "COMPANY_ADMIN_CONTROLLER";


/* =====================================================
   COMPANY ADMIN PRE-LOGIN (EMAIL + PASSWORD → SEND OTP)
===================================================== */
// export const companyAdminPreLogin = async (req, res) => {
//   const { company_id, email, password } = req.body;

//   if (!company_id || !email || !password) {
//     return res.status(400).json({ message: "Missing fields" });
//   }

//   try {
//     /* 1️⃣ Validate company credentials from companies table */
//     const companySql = `
//       SELECT id, password, email, company_name
//       FROM ${TABLES.COMPANIES}
//       WHERE id = ?
//         AND email = ?
//         AND is_active = 1
//       LIMIT 1
//     `;

//     const companies = await dbExec(db, companySql, [company_id, email]);

//     if (!companies.length) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const company = companies[0];

//     const isMatch = await bcrypt.compare(password, company.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     /* 2️⃣ Invalidate previous OTPs */
//     await dbExec(
//       db,
//       `
//       UPDATE ${TABLES.AUTH_OTPS}
//       SET is_used = 1
//       WHERE user_type = 'COMPANY_ADMIN'
//         AND user_id = ?
//         AND is_used = 0
//       `,
//       [company.id]
//     );

//     /* 3️⃣ Generate OTP */
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpHash = await bcrypt.hash(otp, 10);

//     /* 4️⃣ Store OTP */
//     const insertOtpSql = `
//       INSERT INTO ${TABLES.AUTH_OTPS}
//         (user_type, user_id, email, otp_hash, expires_at)
//       VALUES
//         ('COMPANY_ADMIN', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
//     `;

//     const otpResult = await dbExec(db, insertOtpSql, [
//       company.id,
//       company.email,
//       otpHash,
//     ]);

//     /* 5️⃣ Send OTP email */
//     sendSystemEmail({
//       to: company.email,
//       subject: "Company Admin Login OTP",
//       body: `Your OTP is <strong>${otp}</strong>. It is valid for 5 minutes.`
//     });

//     return res.json({
//       tempLoginId: otpResult.insertId,
//       email: company.email,
//       message: "OTP sent to registered email",
//     });
//   } catch (err) {
//     logger.error(MODULE_NAME, "Company admin pre-login failed", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


export const companyAdminPreLogin = async (req, res) => {
  const { company_id, email, password } = req.body;

  if (!company_id || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    /* 1️⃣ Validate company credentials */
    const companySql = `
      SELECT id, password, email, company_name
      FROM ${TABLES.COMPANIES}
      WHERE id = ?
        AND email = ?
        AND is_active = 1
      LIMIT 1
    `;

    const companies = await dbExec(db, companySql, [company_id, email]);

    if (!companies.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const company = companies[0];

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ===== ADD THIS BLOCK (SKIP OTP FOR TESTING) =====
    if (process.env.COMPANYADMIN_SKIP_OTP === "true") {
      const token = generateToken({
        id: company.id,
        role: "COMPANY_ADMIN",
        company_id: company.id
      });

      return res.json({
        message: "Login successful (OTP skipped)",
        token,
        role: "COMPANY_ADMIN",
        company: {
          id: company.id,
          email: company.email,
          name: company.company_name
        },
        skipOtp: true
      });
    }
    // ===== END BLOCK =====

    /* 2️⃣ Invalidate previous OTPs */
    await dbExec(
      db,
      `
      UPDATE ${TABLES.AUTH_OTPS}
      SET is_used = 1
      WHERE user_type = 'COMPANY_ADMIN'
        AND user_id = ?
        AND is_used = 0
      `,
      [company.id]
    );

    /* 3️⃣ Generate OTP */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    /* 4️⃣ Store OTP */
    const insertOtpSql = `
      INSERT INTO ${TABLES.AUTH_OTPS}
        (user_type, user_id, email, otp_hash, expires_at)
      VALUES
        ('COMPANY_ADMIN', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
    `;

    const otpResult = await dbExec(db, insertOtpSql, [
      company.id,
      company.email,
      otpHash,
    ]);

    /* 5️⃣ Send OTP email */
    sendSystemEmail({
      to: company.email,
      subject: "Company Admin Login OTP",
      body: `Your OTP is <strong>${otp}</strong>. It is valid for 5 minutes.`
    });

    return res.json({
      tempLoginId: otpResult.insertId,
      email: company.email,
      message: "OTP sent to registered email",
    });

  } catch (err) {
    logger.error(MODULE_NAME, "Company admin pre-login failed", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   COMPANY ADMIN OTP VERIFY / RESEND
===================================================== */
export const companyAdminVerifyOtp = async (req, res) => {
  const { tempLoginId, otp, action = "VERIFY" } = req.body;

  if (!tempLoginId) {
    return res.status(400).json({ message: "Missing login reference" });
  }

  try {
    /* 1️⃣ Fetch OTP record — expiry checked inside SQL using MySQL NOW() */
    const otpSql = `
      SELECT *
      FROM ${TABLES.AUTH_OTPS}
      WHERE id = ?
        AND user_type = 'COMPANY_ADMIN'
        AND is_used = 0
        AND expires_at > NOW()
      LIMIT 1
    `;

    const otps = await dbExec(db, otpSql, [tempLoginId]);

    if (!otps.length) {
      return res.status(401).json({ message: "Session expired or OTP invalid" });
    }

    const otpRecord = otps[0];

    /* ==========================
       🔁 RESEND OTP
    ========================== */
    if (action === "RESEND") {
      /* Invalidate current OTP */
      await dbExec(
        db,
        `UPDATE ${TABLES.AUTH_OTPS} SET is_used = 1 WHERE id = ?`,
        [otpRecord.id]
      );

      /* Generate new OTP */
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newOtpHash = await bcrypt.hash(newOtp, 10);

      const insertSql = `
        INSERT INTO ${TABLES.AUTH_OTPS}
          (user_type, user_id, email, otp_hash, expires_at)
        VALUES
          ('COMPANY_ADMIN', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
      `;

      const result = await dbExec(db, insertSql, [
        otpRecord.user_id,
        otpRecord.email,
        newOtpHash,
      ]);

      sendSystemEmail({
        to: otpRecord.email,
        subject: "Company Admin Login OTP",
        body: `Your new OTP is <strong>${newOtp}</strong>. It is valid for 5 minutes.`
      });

      return res.json({
        tempLoginId: result.insertId,
        message: "OTP resent successfully",
      });
    }

    /* ==========================
       ✅ VERIFY OTP
    ========================== */
    if (!otp) {
      return res.status(400).json({ message: "OTP required" });
    }

    // ✅ Expiry already checked in SQL — no JS date comparison needed

    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    /* Mark OTP used */
    await dbExec(
      db,
      `UPDATE ${TABLES.AUTH_OTPS} SET is_used = 1 WHERE id = ?`,
      [otpRecord.id]
    );

    /* Get company details from companies table */
    const companyRows = await dbExec(
      db,
      `
      SELECT id, company_name, email
      FROM ${TABLES.COMPANIES}
      WHERE id = ?
      LIMIT 1
      `,
      [otpRecord.user_id]
    );

    if (!companyRows.length) {
      return res.status(404).json({ message: "Company not found" });
    }

    const company = companyRows[0];

    const token = generateToken({
      id: company.id,
      role: "COMPANY_ADMIN",
      company_id: company.id,
    });

    /* Update last login */
    await dbExec(
      db,
      `
      UPDATE ${TABLES.COMPANIES}
      SET last_login_at = NOW()
      WHERE id = ?
      `,
      [company.id]
    );

    return res.json({
      token,
      role: "COMPANY_ADMIN",
      company_id: company.id,
      company_name: company.company_name,
      email: company.email,
    });
  } catch (err) {
    logger.error(MODULE_NAME, "Company admin OTP verification failed", err);
    return res.status(500).json({ message: "Server error" });
  }
};
