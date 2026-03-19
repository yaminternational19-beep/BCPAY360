/**
 * Reset Password Email Template
 */
export const resetPasswordTemplate = (resetLink) => {
    return {
        subject: "Password Reset Request",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #D0021B;">Password Reset Request</h2>
                <p>We received a request to reset your password. Click the button below to proceed:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #4A90E2; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>If you did not request this, please ignore this email. The link will expire in 1 hour.</p>
                <br>
                <p>Best Regards,</p>
                <p><strong>Security Team</strong></p>
            </div>
        `
    };
};
