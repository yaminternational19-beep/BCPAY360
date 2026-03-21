import express from "express";
import {
  createCompany,
  getCompanies,
  getCompaniesForLogin,
  updateCompany,
  getCompanyById
} from "../../../controllers/organization/superadmin/company.controller.js";

import {
  verifyToken,
  requireRole
} from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/* 🔓 PUBLIC (ADMIN LOGIN) */
router.get("/public", getCompaniesForLogin);

/* 🔐 SUPER ADMIN */
router.post("/", verifyToken, requireRole("SUPER_ADMIN"), createCompany);
router.get("/", verifyToken, requireRole("SUPER_ADMIN"), getCompanies);
router.get("/:id", verifyToken, requireRole("SUPER_ADMIN"), getCompanyById);
router.put("/:id", verifyToken, requireRole("SUPER_ADMIN"), updateCompany);

export default router;
