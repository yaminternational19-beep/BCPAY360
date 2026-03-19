import express from "express";
import {
  createCompanyDocument,
  getCompanyDocuments,
  getCompanyDocumentByCode,
  updateCompanyDocument,
  deleteCompanyDocument
} from "../../controllers/organization/companyDocument.controller.js";
import { allowRoles, verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/* PROTECTED - Only COMPANY_ADMIN and HR can manage company documents */
router.use(verifyToken);
router.use(allowRoles("COMPANY_ADMIN", "HR"));

/**
 * CREATE - Add new company document metadata
 * POST /api/admin/company-documents
 * Payload: { document_code, document_name, description }
 */
router.post("/", createCompanyDocument);

/**
 * GET ALL - List available company documents
 * GET /api/admin/company-documents
 */
router.get("/", getCompanyDocuments);

/**
 * GET BY CODE - Get document definition by document_code
 * GET /api/admin/company-documents/:documentCode
 */
router.get("/:documentCode", getCompanyDocumentByCode);

/**
 * UPDATE - Update document metadata
 * PATCH /api/admin/company-documents/:id
 * Payload: { document_name, description }
 */
router.patch("/:id", updateCompanyDocument);

/**
 * DELETE - Remove company document
 * DELETE /api/admin/company-documents/:id
 */
router.delete("/:id", deleteCompanyDocument);

export default router;
