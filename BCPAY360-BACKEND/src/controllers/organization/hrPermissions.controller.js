import db, { dbExec } from "../../config/db.js";
import { TABLES } from "../../utils/tableNames.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "HR_PERMISSIONS_CONTROLLER";

/* =====================================================
   GET HR PERMISSIONS
===================================================== */
export const getHRPermissions = async (req, res) => {
  const { hrId } = req.params;
  const { company_id } = req.user;

  try {
    // 1️⃣ Validate HR belongs to this company
    const hr = await dbExec(
      db,
      `SELECT id FROM ${TABLES.HR_USERS}
       WHERE id = ? AND company_id = ?
       LIMIT 1`,
      [hrId, company_id]
    );

    if (!hr.length) {
      return res.status(404).json({
        success: false,
        message: "HR not found or access denied"
      });
    }

    // 2️⃣ Fetch Permissions
    const sql = `
      SELECT module_key, allowed
      FROM ${TABLES.HR_PERMISSIONS}
      WHERE hr_id = ?
      ORDER BY module_key
    `;

    const permissions = await dbExec(db, sql, [hrId]);

    return res.json({
      success: true,
      data: permissions
    });
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to get HR permissions", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* =====================================================
   SAVE / UPDATE HR PERMISSIONS (REPLACE ALL)
===================================================== */
export const saveHRPermissions = async (req, res) => {
  const { hrId } = req.params;
  const { permissions } = req.body;
  const { company_id } = req.user;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: "permissions array is required"
    });
  }

  try {
    // 1️⃣ Validate HR belongs to this company
    const hr = await dbExec(
      db,
      `SELECT id FROM ${TABLES.HR_USERS}
       WHERE id = ? AND company_id = ?
       LIMIT 1`,
      [hrId, company_id]
    );

    if (!hr.length) {
      return res.status(404).json({
        success: false,
        message: "HR not found or access denied"
      });
    }

    // 2️⃣ Use a transaction for safety
    await db.query("START TRANSACTION");

    // Clear old permissions for this HR
    await db.query(
      `DELETE FROM ${TABLES.HR_PERMISSIONS} WHERE hr_id = ?`,
      [hrId]
    );

    // Insert new permissions
    if (permissions.length > 0) {
      const values = permissions.map(p => [
        hrId,
        p.module_key,
        p.allowed ? 1 : 0
      ]);

      const insertSql = `
        INSERT INTO ${TABLES.HR_PERMISSIONS} (hr_id, module_key, allowed)
        VALUES ?
      `;
      await db.query(insertSql, [values]);
    }

    await db.query("COMMIT");

    return res.json({
      success: true,
      message: "Permissions updated successfully"
    });

  } catch (err) {
    await db.query("ROLLBACK");
    logger.error(MODULE_NAME, "Failed to save HR permissions", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update permissions"
    });
  }
};
