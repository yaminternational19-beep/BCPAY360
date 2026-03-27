import db from "../../config/db.js";
import bcrypt from "bcrypt";
import { uploadToS3, deleteFromS3, getS3SignedUrl } from "../../utils/s3.util.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "ADMIN_PROFILE_CONTROLLER";

/**
 * Get Admin Profile Details
 */
export const getAdminProfile = async (req, res) => {
    try {
        const companyId = req.user.id;

        const [companies] = await db.query(
            "SELECT id, company_name, email, logo_url, timezone FROM companies WHERE id = ?",
            [companyId]
        );

        if (!companies.length) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        const company = companies[0];

        // If logo_url exists as a key, get signed URL
        if (company.logo_url && !company.logo_url.startsWith('http')) {
             company.logo_url = await getS3SignedUrl(company.logo_url);
        }

        res.status(200).json({
            success: true,
            data: company
        });
    } catch (error) {
        logger.error(MODULE_NAME, "getAdminProfile error", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Update Admin Profile Details (Name, Email, Logo)
 */
export const updateAdminProfile = async (req, res) => {
    try {
        const companyId = req.user.id;
        const { company_name, email } = req.body;
        const logoFile = req.file;

        // 1. Fetch current data for logging/cleanup
        const [[currentCompany]] = await db.query(
            "SELECT company_name, logo_url FROM companies WHERE id = ?",
            [companyId]
        );

        let finalLogoUrl = currentCompany.logo_url;

        // 2. Handle Logo Upload if provided
        if (logoFile) {
            try {
                // Delete old logo if it exists
                if (currentCompany.logo_url) {
                    await deleteFromS3(currentCompany.logo_url);
                }

                // Upload new logo
                const s3Key = `companies/${companyId}/logo/${Date.now()}_${logoFile.originalname.replace(/\s+/g, "_")}`;
                const uploadResult = await uploadToS3(logoFile.buffer, s3Key, logoFile.mimetype);
                finalLogoUrl = s3Key; // Store the key
            } catch (err) {
                logger.error(MODULE_NAME, "Logo upload failed", err);
                return res.status(500).json({ success: false, message: "Logo upload failed" });
            }
        }

        // 3. Update Database
        await db.query(
            "UPDATE companies SET company_name = ?, email = ?, logo_url = ? WHERE id = ?",
            [company_name, email, finalLogoUrl, companyId]
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully"
        });
    } catch (error) {
        logger.error(MODULE_NAME, "updateAdminProfile error", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Update Admin Password
 */
export const updateAdminPassword = async (req, res) => {
    try {
        const companyId = req.user.id;
        const { current_password, new_password } = req.body;

        // 1. Get current password_hash
        const [[company]] = await db.query(
            "SELECT password FROM companies WHERE id = ?",
            [companyId]
        );

        // 2. Verify current password
        const isMatch = await bcrypt.compare(current_password, company.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        // 3. Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // 4. Update Database
        await db.query(
            "UPDATE companies SET password = ? WHERE id = ?",
            [hashedPassword, companyId]
        );

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        logger.error(MODULE_NAME, "updateAdminPassword error", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
