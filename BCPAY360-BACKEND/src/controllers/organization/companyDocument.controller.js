import db from "../../config/db.js";
import logger from "../../utils/logger.js";

/**
 * MODULE_NAME: COMPANY_DOCUMENT_CONTROLLER
 * Table: company_documents
 */
const MODULE_NAME = "COMPANY_DOCUMENT_CONTROLLER";

/**
 * CREATE company document (metadata only)
 */
export const createCompanyDocument = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const {
      document_code,
      document_name,
      description = ""
    } = req.body;

    // Validate required fields
    if (!document_code || !document_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: document_code, document_name"
      });
    }

    const docCode = document_code.trim().toUpperCase();

    // Check for duplicate document_code per company
    const [exists] = await db.query(
      `
      SELECT 1
      FROM company_documents
      WHERE company_id = ?
        AND document_code = ?
      LIMIT 1
      `,
      [companyId, docCode]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Document code already exists for this company"
      });
    }

    // Insert document metadata
    const [result] = await db.query(
      `
      INSERT INTO company_documents (
        company_id,
        document_code,
        document_name,
        description,
        uploaded_by
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        companyId,
        docCode,
        document_name.trim(),
        description,
        req.user.id
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Company document created successfully",
      data: {
        id: result.insertId,
        document_code: docCode
      }
    });

  } catch (err) {
    logger.error(MODULE_NAME, "Create Company Document Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create company document"
    });
  }
};

/**
 * GET all company documents
 */
export const getCompanyDocuments = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [rows] = await db.query(
      `
      SELECT
        id,
        document_code,
        document_name,
        description,
        created_at
      FROM company_documents
      WHERE company_id = ?
      ORDER BY created_at DESC
      `,
      [companyId]
    );

    return res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    logger.error(MODULE_NAME, "GET COMPANY DOCUMENTS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company documents"
    });
  }
};

/**
 * GET document by code
 */
export const getCompanyDocumentByCode = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { documentCode } = req.params;

    const [[doc]] = await db.query(
      `
      SELECT
        id,
        document_code,
        document_name,
        description,
        uploaded_by,
        created_at
      FROM company_documents
      WHERE company_id = ?
        AND document_code = ?
      LIMIT 1
      `,
      [companyId, documentCode.toUpperCase()]
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    return res.json({
      success: true,
      data: doc
    });

  } catch (err) {
    logger.error(MODULE_NAME, "GET COMPANY DOCUMENT BY CODE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch document definition"
    });
  }
};

/**
 * UPDATE company document metadata
 */
export const updateCompanyDocument = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { id } = req.params;
    const { document_name, description } = req.body;

    const updates = [];
    const values = [];

    if (document_name) {
      updates.push("document_name = ?");
      values.push(document_name.trim());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid update fields provided"
      });
    }

    values.push(id, companyId);

    const [result] = await db.query(
      `
      UPDATE company_documents
      SET ${updates.join(", ")}
      WHERE id = ? AND company_id = ?
      `,
      values
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    return res.json({
      success: true,
      message: "Document updated successfully"
    });

  } catch (err) {
    logger.error(MODULE_NAME, "UPDATE COMPANY DOCUMENT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update document"
    });
  }
};

/**
 * DELETE company document
 */
export const deleteCompanyDocument = async (req, res) => {
  try {
    const [result] = await db.query(
      `
      DELETE FROM company_documents
      WHERE id = ? AND company_id = ?
      `,
      [req.params.id, req.user.company_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    return res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (err) {
    logger.error(MODULE_NAME, "DELETE COMPANY DOCUMENT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete document"
    });
  }
};
