/**
 * Welcome Email Template
 */
export const welcomeTemplate = (name) => {
    return {
        subject: "Welcome to BCPay360!",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4A90E2;">Hello ${name},</h2>
                <p>Welcome to the <strong>BCPay360 Portal</strong>. We are excited to have you on board!</p>
                <p>You can now log in to your account and explore our services.</p>
                <p>If you have any questions, feel free to reply to this email.</p>
                <br>
                <p>Best Regards,</p>
                <p><strong>HR Team</strong></p>
            </div>
        `
    };
};
