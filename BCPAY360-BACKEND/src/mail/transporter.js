import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Mail Transporter Configuration
 * Uses values from .env file
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for others
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export default transporter;
