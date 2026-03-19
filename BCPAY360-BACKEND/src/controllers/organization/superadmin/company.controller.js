import db, { dbExec } from "../../../config/db.js";
import bcrypt from "bcrypt";
import { TABLES } from "../../../utils/tableNames.js";
import logger from "../../../utils/logger.js";

const MODULE_NAME = "SUPER_ADMIN_COMPANY_CONTROLLER";

/* ============================
   CREATE COMPANY (SUPER ADMIN)
============================ */
export const createCompany = async (req, res) => {
  const { company_name, email, password, timezone, logo_url } = req.body;

  if (!company_name || !email || !password) {
    return res.status(400).json({ message: "Company name, email, and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO ${TABLES.COMPANIES} (company_name, email, password, created_by, timezone, logo_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await dbExec(db, insertSql, [
      company_name, 
      email, 
      hashedPassword, 
      req.user.id,
      timezone || 'Asia/Kolkata',
      logo_url || null
    ]);

    res.status(201).json({
      message: "Company created successfully",
      company: {
        id: result.insertId,
        company_name,
        email
      }
    });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to create company", err);
    res.status(500).json({ message: "DB error" });
  }
};

/* ============================
   SUPER ADMIN – ALL COMPANIES
============================ */
export const getCompanies = async (req, res) => {
  try {
    // 1. Get companies list
    const companiesSql = `
      SELECT 
        id, 
        company_name, 
        email, 
        is_active, 
        created_at, 
        last_login_at, 
        timezone, 
        logo_url
      FROM ${TABLES.COMPANIES}
      ORDER BY created_at DESC
    `;

    // 2. Get stats
    const statsSql = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
      FROM ${TABLES.COMPANIES}
    `;

    const [companies, statsResult] = await Promise.all([
      dbExec(db, companiesSql, []),
      dbExec(db, statsSql, [])
    ]);

    const stats = statsResult[0] || {
      total: 0,
      active: 0,
      inactive: 0
    };

    res.json({
      stats,
      data: companies
    });

  } catch (err) {
    logger.error(MODULE_NAME, "Failed to get companies", err);
    res.status(500).json({ message: "DB error" });
  }
};

/* ============================
   PUBLIC – ADMIN LOGIN DROPDOWN
============================ */
export const getCompaniesForLogin = async (req, res) => {
  try {
    const sql = `
      SELECT id, company_name as name
      FROM ${TABLES.COMPANIES}
      WHERE is_active = 1
      ORDER BY company_name
    `;

    const rows = await dbExec(db, sql, []);
    res.json(rows);
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to get companies for login", err);
    res.status(500).json({ message: "DB error" });
  }
};

/* ============================
   UPDATE COMPANY NAME
============================ */
export const updateCompanyName = async (req, res) => {
  const companyId = req.params.id;
  const { company_name } = req.body;

  if (!company_name) {
    return res.status(400).json({ message: "Company name required" });
  }

  const sql = `
    UPDATE ${TABLES.COMPANIES}
    SET company_name = ?
    WHERE id = ?
  `;

  try {
    const result = await dbExec(db, sql, [company_name, companyId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company name updated successfully" });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to update company name", err);
    res.status(500).json({ message: "DB error" });
  }
};


