/**
 * Salary Credited Email Template
 */
export const salaryTemplate = ({ name, month, year, salarySlipUrl }) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthLabel = monthNames[month - 1] || month;

    return {
        subject: `Salary Credited - ${monthLabel} ${year}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">BCPAY360</h1>
                    <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px;">Payroll Notification</p>
                </div>
                
                <div style="padding: 40px 30px; background-color: #ffffff;">
                    <h2 style="color: #2c3e50; margin-top: 0;">Hello ${name},</h2>
                    <p style="font-size: 16px; color: #555;">Great news! Your salary for <strong>${monthLabel} ${year}</strong> has been successfully credited to your bank account.</p>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid #2a5298; padding: 20px; margin: 25px 0;">
                        <p style="margin: 0; font-weight: bold; color: #2a5298;">Payment Summary:</p>
                        <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Status: Successfully Credited</p>
                        <p style="margin: 2px 0 0; color: #666; font-size: 14px;">Period: ${monthLabel} ${year}</p>
                    </div>

                    ${salarySlipUrl ? `
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${salarySlipUrl}" style="background-color: #2a5298; color: white; padding: 14px 28px; text-rule: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">View Salary Slip</a>
                    </div>
                    <p style="font-size: 12px; color: #999; text-align: center;">The link above is secure and will expire after some time.</p>
                    ` : `
                    <p style="font-size: 14px; color: #666;">You can view and download your detailed payslip by logging into the BCPAY360 Employee Portal.</p>
                    `}

                    <p style="margin-top: 30px; font-size: 16px; color: #555;">If you have any questions regarding your payroll, please contact the HR department.</p>
                </div>

                <div style="background-color: #f4f7f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; font-size: 12px; color: #7f8c8d;">&copy; ${new Date().getFullYear()} BCPAY360. All rights reserved.</p>
                    <p style="margin: 5px 0 0; font-size: 11px; color: #bdc3c7;">This is an automated message, please do not reply.</p>
                </div>
            </div>
        `
    };
};
