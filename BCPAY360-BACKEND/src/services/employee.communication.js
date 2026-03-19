import { sendMail } from "../mail/mail.service.js";
// import { sendNotification } from "./notification.service.js"; // Commented until notifications table is ready
import logger from "../utils/logger.js";

const MODULE_NAME = "EMPLOYEE_COMMUNICATION_SERVICE";

/**
 * SEND WELCOME EMAIL & NOTIFICATION
 */
export const notifyEmployeeCreated = async (employee, password) => {
  try {
    const subject = `Welcome to BCPAY360 - Your Account has been Created`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Hello ${employee.full_name},</h2>
        <p>Your employee account has been successfully created at <b>BCPAY360</b>.</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
          <p><b>Login URL:</b> <a href="https://app.bcpay360.com">app.bcpay360.com</a></p>
          <p><b>Employee Code:</b> ${employee.employee_code}</p>
          <p><b>Email:</b> ${employee.email}</p>
          <p><b>Password:</b> ${password}</p>
        </div>
        <p>Please change your password after your first login.</p>
        <p>Best Regards,<br/>Team BCPAY360</p>
      </div>
    `;

    // 1. Send Email
    await sendMail({ to: employee.email, subject, html });

    // 2. Send Notification (TODO: Enable when table is ready)
    /*
    await sendNotification({
      company_id: employee.company_id,
      branch_id: employee.branch_id,
      user_type: "EMPLOYEE",
      user_id: employee.id,
      title: "Welcome to BCPAY360",
      message: `Your account has been created with code ${employee.employee_code}`,
      notification_type: "SYSTEM",
      action_url: "/profile"
    });
    */

  } catch (err) {
    logger.error(MODULE_NAME, "Failed to notify employee creation", err);
  }
};

/**
 * NOTIFY PROFILE UPDATE
 */
export const notifyProfileUpdated = async (employee) => {
  try {
    const subject = `Your BCPAY360 Profile has been Updated`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Hi ${employee.full_name},</h2>
        <p>Your profile information was recently updated by the HR department.</p>
        <p>If you did not expect this change, please contact your HR manager.</p>
        <p>Best Regards,<br/>Team BCPAY360</p>
      </div>
    `;

    await sendMail({ to: employee.email, subject, html });

    /*
    await sendNotification({
      company_id: employee.company_id,
      branch_id: employee.branch_id,
      user_type: "EMPLOYEE",
      user_id: employee.id,
      title: "Profile Updated",
      message: "Your profile information has been updated by HR.",
      notification_type: "SYSTEM",
      action_url: "/profile"
    });
    */
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to notify profile update", err);
  }
};

/**
 * NOTIFY STATUS CHANGE
 */
export const notifyStatusChanged = async (employee, status) => {
  try {
    const subject = `BCPAY360 Account Status: ${status}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Hi ${employee.full_name},</h2>
        <p>Your BCPAY360 account status has been changed to <b>${status}</b>.</p>
        <p>Best Regards,<br/>Team BCPAY360</p>
      </div>
    `;

    await sendMail({ to: employee.email, subject, html });

    /*
    await sendNotification({
      company_id: employee.company_id,
      branch_id: employee.branch_id,
      user_type: "EMPLOYEE",
      user_id: employee.id,
      title: "Account Status Changed",
      message: `Your account is now ${status}`,
      notification_type: "SYSTEM"
    });
    */
  } catch (err) {
    logger.error(MODULE_NAME, "Failed to notify status change", err);
  }
};
