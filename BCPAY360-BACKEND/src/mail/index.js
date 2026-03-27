import { sendMail } from "./mail.service.js";
import { welcomeTemplate } from "./templates/welcome.template.js";
import { resetPasswordTemplate } from "./templates/resetPassword.template.js";
import { genericTemplate } from "./templates/generic.template.js";
import { salaryTemplate } from "./templates/salary.template.js";

/**
 * High-level Email Helpers (Compat for controllers)
 */

/**
 * Send System / Generic Email
 */
export const sendSystemEmail = async ({ to, subject, body }) => {
    const { html, text } = genericTemplate({ subject, body });
    return await sendMail({ to, subject, html, text });
};

/**
 * Send OTP Email (Convenience wrapper)
 */
export const sendOtpEmail = async (to, otp) => {
    const subject = "Verification OTP - BCPay360";
    const body = `Your OTP code is: <strong>${otp}</strong>. It is valid for 5 minutes.`;
    const { html, text } = genericTemplate({ subject, body });
    return await sendMail({ to, subject, html, text });
};

/**
 * Send Salary Credited Email
 */
export const sendSalaryEmail = async ({ to, name, month, year, salarySlipUrl }) => {
    const { subject, html } = salaryTemplate({ name, month, year, salarySlipUrl });
    return await sendMail({ to, subject, html });
};

/**
 * Main Mail Service Entry Point
 * Consolidates all mail functions and templates for easy access.
 */
export {
    sendMail,
    welcomeTemplate,
    resetPasswordTemplate,
    genericTemplate,
    salaryTemplate
};

// Also export as a default object for flexibility
export default {
    sendMail,
    sendSystemEmail,
    sendOtpEmail,
    sendSalaryEmail,
    welcomeTemplate,
    resetPasswordTemplate,
    genericTemplate,
    salaryTemplate
};
