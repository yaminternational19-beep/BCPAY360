import db from "../config/db.js";

/**
 * Leave Management Tables
 * Usage: node src/models/leave.js
 */
const TABLES = [
  {
    name: "leave_types",
    query: `
      CREATE TABLE IF NOT EXISTS leave_types (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        company_id BIGINT NOT NULL,

        leave_code VARCHAR(10) NOT NULL,      -- EL, SL, CL
        leave_name VARCHAR(100) NOT NULL,

        annual_quota DECIMAL(5,2) NOT NULL,
        is_paid TINYINT(1) NOT NULL DEFAULT 1,

        allow_carry_forward TINYINT(1) DEFAULT 0,
        max_carry_forward DECIMAL(5,2) NULL,

        half_day_allowed TINYINT(1) DEFAULT 1,
        sandwich_rule TINYINT(1) DEFAULT 0,

        gender_restriction ENUM('ALL','MALE','FEMALE') DEFAULT 'ALL',
        max_continuous_days INT NULL,
        document_required TINYINT(1) DEFAULT 0,

        min_service_months INT DEFAULT 0,

        leave_year INT NOT NULL,

        is_active TINYINT(1) DEFAULT 1,

        created_by_role ENUM('COMPANY_ADMIN','HR') NOT NULL,
        created_by_id BIGINT NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uq_company_leave (company_id, leave_code, leave_year),

        FOREIGN KEY (company_id)
          REFERENCES companies(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "employee_leave_requests",
    query: `
      CREATE TABLE IF NOT EXISTS employee_leave_requests (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        company_id BIGINT NOT NULL,
        branch_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,

        leave_type_id BIGINT NOT NULL,

        from_date DATE NOT NULL,
        to_date DATE NOT NULL,

        total_days DECIMAL(4,2) NOT NULL,

        reason TEXT NULL,
        document_path VARCHAR(255) NULL,

        status ENUM('PENDING','APPROVED','REJECTED','CANCELLED')
          NOT NULL DEFAULT 'PENDING',

        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        approved_by BIGINT NULL,
        approved_at TIMESTAMP NULL,
        rejected_by BIGINT NULL,
        rejected_at TIMESTAMP NULL,

        cancelled_at TIMESTAMP NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        KEY idx_employee (employee_id),
        KEY idx_status (status),

        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
      );
    `
  },
  {
    name: "leave_ledger",
    query: `
      CREATE TABLE IF NOT EXISTS leave_ledger (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        company_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,
        leave_type_id BIGINT NOT NULL,

        request_id BIGINT NULL,

        action_type ENUM(
          'CREDIT',
          'DEBIT',
          'CARRY_FORWARD',
          'LAPSE'
        ) NOT NULL,

        days DECIMAL(5,2) NOT NULL COMMENT '+credit / -debit',

        source ENUM('SYSTEM','HR','EMPLOYEE','APPROVE','REJECT') DEFAULT 'SYSTEM',

        acted_by_role ENUM('COMPANY_ADMIN','HR','EMPLOYEE','SYSTEM') NULL,
        acted_by_id BIGINT NULL,

        remarks VARCHAR(255) NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        KEY idx_emp_leave (employee_id, leave_type_id),
        KEY idx_company (company_id),

        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),

        FOREIGN KEY (request_id)
          REFERENCES employee_leave_requests(id)
          ON DELETE SET NULL
      );
    `
  }
];

const initLeaveTables = async () => {
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

initLeaveTables();
