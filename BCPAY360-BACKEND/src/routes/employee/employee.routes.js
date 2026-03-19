import express from "express";
import { updateEmployeeProfile } from "../../controllers/employee/employee.controller.js";
import { verifyEmployeeToken } from "../../middlewares/auth.middleware.js";
import { upload, handleUploadError } from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.put(
    "/edit-profile",
    verifyEmployeeToken,
    upload.single("profile_photo"),
    handleUploadError,
    updateEmployeeProfile
);

export default router;
