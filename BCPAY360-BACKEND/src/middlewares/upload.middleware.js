import multer from "multer";

/**
 * Memory storage for S3 uploads
 */
const storage = multer.memoryStorage();

/**
 * Allowed file types
 */
const ALLOWED_TYPES = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

/**
 * File filter to ensure only allowed types are uploaded
 */
const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
};

/**
 * Configurable multer middleware
 */
export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter
});

/**
 * Error handler for multer/S3 upload failures
 */
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ message: err.message || "Upload failed" });
    }
    next();
};
