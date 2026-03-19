import express from "express";
import { verifyToken, allowRoles } from "../../middlewares/auth.middleware.js";
import {
  getEmployeesByForm,
  uploadEmployeeForm,
  replaceEmployeeForm,
  deleteEmployeeForm
} from "../../controllers/admin/adminForms.controller.js";

import { upload, handleUploadError } from "../../middlewares/upload.middleware.js";

const router = express.Router();

/* PREFLIGHT */
router.options("*", (_, res) => res.sendStatus(200));

/* 🔐 AUTH */

// Remove router.use(allowRoles(...)) because it blocks other routers on /api/admin

/* =====================
   LIST EMPLOYEES BY FORM
===================== */
router.get("/", verifyToken, allowRoles("COMPANY_ADMIN", "SUPER_ADMIN", "HR"), getEmployeesByForm);

/* =====================
   UPLOAD (NEW)
===================== */
router.post(
  "/upload",
  verifyToken,
  allowRoles("COMPANY_ADMIN", "SUPER_ADMIN", "HR"),
  upload.single("document"),
  handleUploadError,
  uploadEmployeeForm
);

/* =====================
   REPLACE (EXISTING)
===================== */
router.put(
  "/replace",
  verifyToken,
  allowRoles("COMPANY_ADMIN", "SUPER_ADMIN", "HR"),
  upload.single("document"),
  handleUploadError,
  replaceEmployeeForm
);

/* =====================
   DELETE
===================== */
router.delete(
  "/delete",
  verifyToken,
  allowRoles("COMPANY_ADMIN", "SUPER_ADMIN", "HR"),
  deleteEmployeeForm
);

export default router;
