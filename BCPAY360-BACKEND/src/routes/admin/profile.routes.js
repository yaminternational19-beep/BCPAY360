import express from "express";
import { verifyToken, allowRoles } from "../../middlewares/auth.middleware.js";
import { upload, handleUploadError } from "../../middlewares/upload.middleware.js";
import {
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword
} from "../../controllers/admin/profile.controller.js";

const router = express.Router();

/**
 * 🔒 ADMIN ONLY ROUTES
 */
router.get("/", verifyToken, allowRoles("COMPANY_ADMIN"), getAdminProfile);
router.put("/", verifyToken, allowRoles("COMPANY_ADMIN"), upload.single('logo'), handleUploadError, updateAdminProfile);
router.patch("/password", verifyToken, allowRoles("COMPANY_ADMIN"), updateAdminPassword);

export default router;
