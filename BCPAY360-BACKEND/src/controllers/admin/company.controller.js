import db from "../../config/db.js";
import logger from "../../utils/logger.js";
import { uploadToS3, getS3SignedUrl } from "../../utils/s3.util.js";
import { hashPassword, comparePassword } from "../../utils/password.js";

const MODULE_NAME = "ADMIN_COMPANY_CONTROLLER";

/**
 * Get Company Profile
 */
export const getCompanyProfile = async (req, res) => {
    try {
        const { company_id } = req.user;

        const [rows] = await db.query(
            `SELECT id, company_name, email, timezone, logo_url, created_at 
             FROM companies 
             WHERE id = ?`,
            [company_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        const data = rows[0];
        
        // If logo_url is an S3 key, generate signed URL. 
        // If it's already a full URL, we can still try to extract the key if needed, 
        // but for now, let's assume if it contains 's3.amazonaws.com' it might be a static URL.
        // However, to be safe, we'll store the URL but if it's not displaying, 
        // generating a signed URL from the key is better.
        
        let display_url = data.logo_url;
        if (display_url && display_url.includes("s3.amazonaws.com")) {
            // Extract key from URL if it's our bucket
            try {
                const urlObj = new URL(display_url);
                const key = urlObj.pathname.substring(1); // remove leading /
                const signed = await getS3SignedUrl(key);
                if (signed) display_url = signed;
            } catch (e) {
                // Not a valid URL or other issue, keep original
            }
        }

        res.json({ 
            success: true, 
            data: { ...data, logo_url: display_url } 
        });
    } catch (err) {
        logger.error(MODULE_NAME, "Failed to fetch company profile", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Update Company Profile
 */
export const updateCompanyProfile = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { company_name, email, timezone } = req.body;

        if (!company_name || !email) {
            return res.status(400).json({ success: false, message: "Company name and email are required" });
        }

        // Check unique email (excluding current company)
        const [existing] = await db.query(
            "SELECT id FROM companies WHERE email = ? AND id != ?",
            [email, company_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Email is already in use by another company" });
        }

        await db.query(
            `UPDATE companies 
             SET company_name = ?, email = ?, timezone = ?
             WHERE id = ?`,
            [company_name, email, timezone || "Asia/Kolkata", company_id]
        );

        res.json({ success: true, message: "Company profile updated successfully" });
    } catch (err) {
        logger.error(MODULE_NAME, "Failed to update company profile", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Update Company Logo
 */
export const updateCompanyLogo = async (req, res) => {
    try {
        const { company_id } = req.user;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No logo file uploaded" });
        }

        // Get company name for S3 key
        const [company] = await db.query("SELECT company_name FROM companies WHERE id = ?", [company_id]);
        if (company.length === 0) return res.status(404).json({ success: false, message: "Company not found" });

        const companyName = company[0].company_name;
        const companyNameClean = companyName.toLowerCase().replace(/\s+/g, "_");
        const timestamp = Date.now();
        const s3Key = `${companyNameClean}/logos/${timestamp}_${req.file.originalname.replace(/\s+/g, "_")}`;

        const uploadResult = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);

        await db.query(
            "UPDATE companies SET logo_url = ? WHERE id = ?",
            [uploadResult.url, company_id]
        );

        // Generate signed URL for immediate display
        const signedUrl = await getS3SignedUrl(s3Key);

        res.json({
            success: true,
            message: "Company logo updated successfully",
            logo_url: signedUrl || uploadResult.url
        });
    } catch (err) {
        logger.error(MODULE_NAME, "Failed to update company logo", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Update Company Password
 */
export const updateCompanyPassword = async (req, res) => {
    try {
        const { company_id } = req.user;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Current and new password are required" });
        }

        const [rows] = await db.query("SELECT password FROM companies WHERE id = ?", [company_id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Company not found" });

        const isMatch = await comparePassword(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect current password" });
        }

        const hashedPassword = await hashPassword(newPassword);
        await db.query("UPDATE companies SET password = ? WHERE id = ?", [hashedPassword, company_id]);

        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        logger.error(MODULE_NAME, "Failed to update company password", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
