import db from "../config/db.js";

/**
 * Holiday Management Tables
 * Usage: node src/models/holidays.js
 */
const TABLES = [
  {
    name: "branch_holidays",
    query: `
      CREATE TABLE IF NOT EXISTS branch_holidays (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        -- ownership
        company_id BIGINT NOT NULL,
        branch_id BIGINT NOT NULL,

        -- holiday identity
        holiday_name VARCHAR(150) NULL,
        holiday_date DATE NOT NULL,
        holiday_year INT NOT NULL,

        -- recurrence
        is_recurring TINYINT(1) NOT NULL DEFAULT 0,

        -- classification
        holiday_category ENUM('OFFICIAL','COMPANY_DEFINED','OPTIONAL') NOT NULL DEFAULT 'OFFICIAL',
        reason_type VARCHAR(30) NOT NULL,
        reason_text VARCHAR(255) NULL,

        -- multi-day support
        start_date DATE NULL,
        end_date DATE NULL,

        -- weekend / pattern support
        weekday ENUM(
          'SUNDAY','MONDAY','TUESDAY','WEDNESDAY',
          'THURSDAY','FRIDAY','SATURDAY'
        ) NULL,

        -- half day support
        is_half_day TINYINT(1) NOT NULL DEFAULT 0,
        half_day_type ENUM('FIRST_HALF','SECOND_HALF') NULL,

        -- behavior flags
        is_paid TINYINT(1) NOT NULL DEFAULT 1,
        applies_to_attendance TINYINT(1) NOT NULL DEFAULT 1,
        applies_to_payroll TINYINT(1) NOT NULL DEFAULT 1,

        -- lifecycle
        status ENUM('DRAFT','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        deleted_at TIMESTAMP NULL,

        -- audit
        created_by_role ENUM('COMPANY_ADMIN','HR') NOT NULL,
        created_by_id BIGINT NOT NULL,
        approved_by BIGINT NULL,
        approved_at TIMESTAMP NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        -- constraints
        UNIQUE KEY uq_branch_holiday (branch_id, holiday_date),

        KEY idx_company_year (company_id, holiday_year),
        KEY idx_branch_year (branch_id, holiday_year),
        KEY idx_holiday_date (holiday_date),

        CONSTRAINT fk_holidays_company
          FOREIGN KEY (company_id)
          REFERENCES companies(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_holidays_branch
          FOREIGN KEY (branch_id)
          REFERENCES branches(id)
          ON DELETE CASCADE
      );
    `
  }
];

const initHolidayTables = async () => {
  try {
    for (const table of TABLES) {
      await db.query(table.query);
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
    process.exit(1);
  }
};

initHolidayTables();
