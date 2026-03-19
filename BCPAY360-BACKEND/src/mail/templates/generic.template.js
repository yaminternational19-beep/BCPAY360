/**
 * Generic HTML Template for miscellaneous system emails
 */
export const genericTemplate = ({ subject, body }) => {
    return {
        subject: subject || "BCPAY360 Notification",

        html: `
        <div style="background-color:#f4f6f8; padding:30px 0; font-family:Arial, sans-serif;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background:#4A90E2; padding:20px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:22px;">BCPAY360</h1>
                </div>

                <!-- Body -->
                <div style="padding:30px; color:#333;">
                    <h2 style="margin-top:0; font-size:20px; color:#4A90E2;">
                        ${subject || "Notification"}
                    </h2>

                    <div style="margin-top:15px; font-size:15px; line-height:1.6;">
                        <p>Dear User,</p>

                        <p>
                            ${body}
                        </p>

                        <p style="margin-top:20px;">
                            If you have any questions or require further assistance, please contact our support team.
                        </p>

                        <p style="margin-top:20px;">
                            Regards,<br/>
                            <strong>BCPAY360 Team</strong>
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background:#fafafa; padding:20px; text-align:center; font-size:12px; color:#777;">
                    <p style="margin:5px 0;">
                        This is a system-generated email. Replies to this address are not monitored.
                    </p>
                    <p style="margin:5px 0;">
                        © ${new Date().getFullYear()} BCPAY360. All rights reserved.
                    </p>
                </div>

            </div>
        </div>
        `,

        text: `
${subject || "BCPAY360 Notification"}

Dear User,

${body}

If you require any assistance, please contact support.

Regards,  
BCPAY360 Team

---
This is a system-generated email. Replies are not monitored.
        `
    };
};