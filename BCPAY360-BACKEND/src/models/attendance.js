import db from "../config/db.js";

/**
 * Attendance & Logs Models
 * Usage: node src/models/attendance.js
 */

const TABLES = [
  {
    name: "attendance",
    query: `
      CREATE TABLE IF NOT EXISTS attendance (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        company_id BIGINT NOT NULL,
        branch_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,
        shift_id BIGINT NOT NULL,

        attendance_date DATE NOT NULL,

        check_in_time DATETIME NULL,
        check_out_time DATETIME NULL,
        auto_checkout_at DATETIME NULL,

        work_minutes INT NOT NULL DEFAULT 0,
        overtime_minutes INT NOT NULL DEFAULT 0,
        late_minutes INT NOT NULL DEFAULT 0,

        status TINYINT NOT NULL DEFAULT 0 COMMENT '0=Absent,1=Present,2=Late,3=HalfDay,4=LatePresent',
        session_status TINYINT NOT NULL DEFAULT 0 COMMENT '0=NotStarted,1=InProgress,2=Completed',

        is_late TINYINT(1) NOT NULL DEFAULT 0,
        is_overtime TINYINT(1) NOT NULL DEFAULT 0,
        auto_checkout TINYINT(1) NOT NULL DEFAULT 0,

        check_in_lat DECIMAL(10,7) NULL,
        check_in_lng DECIMAL(10,7) NULL,
        check_out_lat DECIMAL(10,7) NULL,
        check_out_lng DECIMAL(10,7) NULL,

        remarks VARCHAR(255) NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uq_employee_day (employee_id, attendance_date),

        KEY idx_company_date (company_id, attendance_date),
        KEY idx_employee_date (employee_id, attendance_date),
        KEY idx_shift (shift_id),

        CONSTRAINT fk_att_company FOREIGN KEY (company_id) REFERENCES companies(id),
        CONSTRAINT fk_att_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
        CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT fk_att_shift FOREIGN KEY (shift_id) REFERENCES shifts(id)
      );
    `
  },

  {
    name: "attendance_logs",
    query: `
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        attendance_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,

        action_type TINYINT NOT NULL COMMENT '1=CheckIn,2=CheckOut,3=AutoCheckout,4=OTStart,5=OTStop,6=AdminEdit',

        action_time DATETIME NOT NULL,

        lat DECIMAL(10,7) NULL,
        lng DECIMAL(10,7) NULL,

        ip_address VARCHAR(45) NULL,
        device_info VARCHAR(100) NULL,

        old_data JSON NULL,
        new_data JSON NULL,

        reason VARCHAR(255) NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        KEY idx_attendance (attendance_id),
        KEY idx_employee (employee_id),
        KEY idx_action (action_type),
        KEY idx_created (created_at),

        CONSTRAINT fk_att_logs_attendance
          FOREIGN KEY (attendance_id)
          REFERENCES attendance(id)
          ON DELETE CASCADE
      );
    `
  },

  {
    name: "overtime_logs",
    query: `
      CREATE TABLE IF NOT EXISTS overtime_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        attendance_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,

        overtime_start DATETIME NOT NULL,
        overtime_end DATETIME NULL,

        duration_minutes INT NOT NULL DEFAULT 0,
        is_auto_stopped TINYINT(1) NOT NULL DEFAULT 0,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        KEY idx_attendance (attendance_id),
        KEY idx_employee (employee_id),

        CONSTRAINT fk_ot_attendance
          FOREIGN KEY (attendance_id)
          REFERENCES attendance(id)
          ON DELETE CASCADE
      );
    `
  }
];

const initAttendanceTables = async () => {
  try {
    console.log("🚀 Starting attendance tables initialization...");
    for (const table of TABLES) {
      console.log(`   Initializing ${table.name}...`);
      await db.query(table.query);
    }
    console.log("✅ All attendance tables are ready.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
    process.exit(1);
  }
};

initAttendanceTables();