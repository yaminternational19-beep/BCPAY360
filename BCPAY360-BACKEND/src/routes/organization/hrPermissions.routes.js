import express from "express";
import {
  getHRPermissions,
  saveHRPermissions,
} from "../../controllers/organization/hrPermissions.controller.js";

import { allowRoles, verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/* 🔐 COMPANY ADMIN ONLY */
router.use(verifyToken);
router.use(allowRoles("COMPANY_ADMIN"));

/**
 * GET PERMISSIONS
 * GET /api/hr-permissions/:hrId
 */
router.get("/:hrId", getHRPermissions);

/**
 * SAVE/UPDATE PERMISSIONS (Replaces all)
 * POST /api/hr-permissions/:hrId
 */
router.post("/:hrId", saveHRPermissions);

export default router;
