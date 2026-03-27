import transporter from "./transporter.js";
import logger from "../utils/logger.js";

const MODULE_NAME = "MAIL_SERVICE";

/**
 * Reusable sendMail function
 * @param {Object} options - { to, subject, html, text }
 */
export const sendMail = async ({ to, subject, html, text }) => {
    try {
        if (!to) throw new Error("Recipient 'to' is required");
        if (!subject) throw new Error("Subject is required");
        if (!html && !text) throw new Error("Email body (html or text) is required");

        const info = await transporter.sendMail({
            from: `"BCPay360 Support" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            text,
            html,
        });

        logger.info(MODULE_NAME, `Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(MODULE_NAME, `Failed to send email to ${to}`, error);
        throw error; // Re-throw to handle in the calling function
    }
};
