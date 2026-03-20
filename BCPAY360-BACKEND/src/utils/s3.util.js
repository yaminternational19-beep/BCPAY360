import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { S3_BUCKET_NAME } from "../config/s3.config.js";
import logger from "./logger.js";

const MODULE_NAME = "S3_UTIL";

/**
 * Upload file to S3
 */
export const uploadToS3 = async (fileBuffer, s3Key, mimetype) => {
    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: mimetype
            })
        );
        return { key: s3Key, url: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}` };
    } catch (err) {
        logger.error(MODULE_NAME, "Upload failed", err);
        throw new Error("S3 upload failed");
    }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key) => {
    if (!key) return;
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key
        }));
    } catch (err) {
        logger.error(MODULE_NAME, `Delete failed: ${key}`, err);
    }
};

/**
 * Get signed URL for S3 object
 */
export const getS3SignedUrl = async (key, expiresIn = 3600) => {
    if (!key) return null;
    try {
        const command = new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key
        });
        return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (err) {
        logger.error(MODULE_NAME, "Signed URL generation failed", err);
        return null;
    }
};

/**
 * Higher-level helper that signs a URL if it's stored as a full URL
 */
export const signFullUrl = async (storedUrl, expiresIn = 3600) => {
    if (!storedUrl) return null;
    try {
        // Handle both full URLs and raw keys
        // Extract key from https://bucket.s3.region.amazonaws.com/key
        const parts = storedUrl.split('.com/');
        const key = parts.length > 1 ? parts[1] : storedUrl;
        
        return await getS3SignedUrl(key, expiresIn);
    } catch (err) {
        return storedUrl;
    }
};

/**
 * Get raw file buffer from S3
 */
export const getS3Object = async (key) => {
    if (!key) return null;
    try {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key
        }));
        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (err) {
        logger.error(MODULE_NAME, `Fetch failed: ${key}`, err);
        return null;
    }
};

/**
 * Helper to generate S3 keys consistently
 * Format: company_name/branch_name/employee_code/category/timestamp_filename
 */
export const generateS3Key = (companyName, branchName, employeeCode, category, originalName) => {
    const timestamp = Date.now();
    const cleanCompanyName = companyName.toString().replace(/\s+/g, "_").toLowerCase();
    const cleanBranchName = branchName.toString().replace(/\s+/g, "_").toLowerCase();
    const cleanEmployeeCode = employeeCode.toString().replace(/\s+/g, "_").toUpperCase();
    const cleanCategory = category.toString().replace(/\s+/g, "_").toLowerCase();
    const cleanFileName = originalName.toString().replace(/\s+/g, "_");

    return `${cleanCompanyName}/${cleanBranchName}/${cleanEmployeeCode}/${cleanCategory}/${timestamp}_${cleanFileName}`;
};
