import express from "express";
import {
  superAdminLogin,
  sendSuperAdminOTP,
  superAdminLogout,
  getCompanySummary,
  updateCompanyStatus
} from "../../../controllers/organization/superadmin/superAdmin.controller.js";

import { verifyToken, requireRole } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/* AUTH */
router.post("/login", superAdminLogin);
router.post("/send-otp", sendSuperAdminOTP);
router.post(
  "/logout",
  verifyToken,
  requireRole("SUPER_ADMIN"),
  superAdminLogout
);

/* COMPANY */
router.get(
  "/companies/:id/summary",
  verifyToken,
  requireRole("SUPER_ADMIN"),
  getCompanySummary
);

router.patch(
  "/companies/:id/status",
  verifyToken,
  requireRole("SUPER_ADMIN"),
  updateCompanyStatus
);

export default router;
