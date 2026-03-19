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

        attendance_date DATE NOT NULL,

        check_in_time DATETIME NULL,
        check_out_time DATETIME NULL,
        auto_checkout_at DATETIME NULL,

        shift_id BIGINT NULL,

        -- durations
        min_work_minutes INT NOT NULL DEFAULT 180,
        full_day_minutes INT NOT NULL DEFAULT 480,

        worked_minutes INT NOT NULL DEFAULT 0,
        overtime_minutes INT NOT NULL DEFAULT 0,
        late_minutes INT NOT NULL DEFAULT 0,

        -- geo tracking
        check_in_lat DECIMAL(10,7) NULL,
        check_in_lng DECIMAL(10,7) NULL,
        check_out_lat DECIMAL(10,7) NULL,
        check_out_lng DECIMAL(10,7) NULL,

        -- unified source
        source ENUM('AUTO','MANUAL','BIOMETRIC','MOBILE','WEB') DEFAULT 'AUTO',

        -- CLEAN STATUS DESIGN
        attendance_status ENUM(
          'PRESENT','ABSENT','HALF_DAY','LEAVE','HOLIDAY'
        ) NOT NULL DEFAULT 'ABSENT',

        session_status ENUM(
          'NOT_STARTED','IN_PROGRESS','COMPLETED'
        ) NOT NULL DEFAULT 'NOT_STARTED',

        -- flags
        is_late TINYINT(1) NOT NULL DEFAULT 0,
        is_overtime TINYINT(1) NOT NULL DEFAULT 0,

        -- approval
        approval_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'APPROVED',
        approved_by BIGINT NULL,
        approved_at TIMESTAMP NULL,

        remarks VARCHAR(255) NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        -- constraints
        UNIQUE KEY uq_employee_day (employee_id, attendance_date),

        -- Note: CHECK constraints are enforced in MySQL 8.0.16+
        CONSTRAINT chk_checkout_requires_checkin
          CHECK (check_out_time IS NULL OR check_in_time IS NOT NULL),

        KEY idx_company_date (company_id, attendance_date),
        KEY idx_employee_date (employee_id, attendance_date),

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

        actor_role ENUM('EMPLOYEE','HR','COMPANY_ADMIN','SUPER_ADMIN') NOT NULL,
        actor_id BIGINT NOT NULL,

        action ENUM('CHECK_IN','CHECK_OUT','ADMIN_EDIT') NOT NULL,
        source ENUM('WEB','MOBILE','ADMIN','BIOMETRIC') NOT NULL,

        device_type ENUM('ANDROID','IOS','DESKTOP','UNKNOWN') DEFAULT 'UNKNOWN',

        old_data JSON NULL,
        new_data JSON NULL,

        reason VARCHAR(255) NULL,

        approval_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',

        ip_address VARCHAR(45) NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        KEY idx_attendance (attendance_id),
        KEY idx_actor (actor_role, actor_id),
        KEY idx_action (action),
        KEY idx_created (created_at),

        CONSTRAINT fk_att_logs_attendance
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
