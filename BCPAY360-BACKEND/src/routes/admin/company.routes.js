import express from "express";
import { 
    getCompanyProfile, 
    updateCompanyProfile, 
    updateCompanyLogo,
    updateCompanyPassword
} from "../../controllers/admin/company.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { upload, handleUploadError } from "../../middlewares/upload.middleware.js";

const router = express.Router();

// Get Company Profile
router.get("/profile", verifyToken, getCompanyProfile);

// Update Company Profile
router.put("/profile", verifyToken, updateCompanyProfile);

// Upload Company Logo
router.post(
    "/logo", 
    verifyToken, 
    upload.single("logo"), 
    handleUploadError, 
    updateCompanyLogo
);

// Update Company Password
router.put("/password", verifyToken, updateCompanyPassword);

export default router;
