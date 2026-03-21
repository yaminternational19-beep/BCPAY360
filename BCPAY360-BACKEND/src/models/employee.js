import db from "../config/db.js";

/**
 * Employee Module Tables
 */
const TABLES = [
  {
    name: "employees",
    query: `
      CREATE TABLE IF NOT EXISTS employees (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        company_id BIGINT NOT NULL,
        branch_id BIGINT NOT NULL,
        department_id BIGINT NOT NULL,
        designation_id BIGINT NOT NULL,

        employee_code VARCHAR(30) NOT NULL,

        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150),

        country_code VARCHAR(10) NOT NULL DEFAULT '+91',
        phone_number VARCHAR(20),

        employee_status VARCHAR(20) DEFAULT 'ACTIVE',
        employment_status VARCHAR(30) DEFAULT 'ACTIVE',

        employee_type_id BIGINT NULL,
        shift_id BIGINT NULL,

        joining_date DATE NOT NULL,
        confirmation_date DATE NULL,
        notice_period_days INT NULL,

        experience_years DECIMAL(4,1) NULL,

        salary DECIMAL(12,2) NULL,
        ctc_annual DECIMAL(14,2) NULL,
        is_salary_confidential TINYINT(1) DEFAULT 1,

        job_location VARCHAR(150) NULL,
        site_location VARCHAR(150) NULL,

        reporting_manager_id BIGINT NULL,

        is_profile_locked TINYINT(1) DEFAULT 0,

        created_by BIGINT NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- constraints
        UNIQUE KEY uq_company_employee_code (company_id, employee_code),
        UNIQUE KEY uq_company_email (company_id, email),

        -- indexes
        KEY idx_company (company_id),
        KEY idx_branch (branch_id),
        KEY idx_department (department_id),
        KEY idx_designation (designation_id),
        KEY idx_email (email),
        KEY idx_employee_code (employee_code),
        KEY idx_reporting_manager (reporting_manager_id),

        -- foreign keys
        CONSTRAINT fk_emp_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        CONSTRAINT fk_emp_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
        CONSTRAINT fk_emp_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
        CONSTRAINT fk_emp_designation FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE RESTRICT,
        CONSTRAINT fk_emp_manager FOREIGN KEY (reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL
      );
    `
  },
  {
    name: "employee_profiles",
    query: `
      CREATE TABLE IF NOT EXISTS employee_profiles (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        employee_id BIGINT NOT NULL,

        gender VARCHAR(20),
        dob DATE NULL,
        religion VARCHAR(100) NULL,
        father_name VARCHAR(150) NULL,
        marital_status VARCHAR(20) NULL,

        qualification VARCHAR(150) NULL,

        emergency_country_code VARCHAR(10),
        emergency_contact VARCHAR(20),

        aadhaar_number VARCHAR(20) NULL,
        pan_number VARCHAR(20) NULL,
        uan_number VARCHAR(20) NULL,
        esic_number VARCHAR(20) NULL,

        address TEXT NULL,
        permanent_address TEXT NULL,

        bank_name VARCHAR(150) NULL,
        account_number VARCHAR(50) NULL,
        ifsc_code VARCHAR(20) NULL,
        bank_branch_name VARCHAR(150) NULL,

        profile_photo_url TEXT NULL,

        last_updated_by BIGINT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uq_employee_profile (employee_id),

        CONSTRAINT fk_profile_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "employee_auth",
    query: `
      CREATE TABLE IF NOT EXISTS employee_auth (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        employee_id BIGINT NOT NULL,

        password_hash VARCHAR(255) NOT NULL,

        is_active TINYINT(1) DEFAULT 1,

        last_login_at TIMESTAMP NULL,
        last_password_reset_at TIMESTAMP NULL,
        login_failed_attempts INT DEFAULT 0,
        is_account_locked TINYINT(1) DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uq_employee_auth (employee_id),

        CONSTRAINT fk_auth_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "employee_documents",
    query: `
      CREATE TABLE IF NOT EXISTS employee_documents (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        employee_id BIGINT NOT NULL,

        document_type VARCHAR(100) NOT NULL,
        document_number VARCHAR(100),

        file_url TEXT NOT NULL,

        is_employee_visible TINYINT(1) DEFAULT 0,

        uploaded_by BIGINT NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY uq_employee_document (employee_id, document_type),
        KEY idx_employee (employee_id),

        CONSTRAINT fk_docs_employee FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "employee_otps",
    query: `
      CREATE TABLE IF NOT EXISTS employee_otps (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        otp VARCHAR(6) NOT NULL,
        purpose ENUM('LOGIN', 'FORGOT_PASSWORD') NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used TINYINT(1) NOT NULL DEFAULT 0,
        attempt_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        KEY idx_employee (employee_id),
        KEY idx_purpose (purpose),
        KEY idx_expires (expires_at),

        CONSTRAINT fk_employee_otps_employee
          FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "employee_sessions",
    query: `
      CREATE TABLE IF NOT EXISTS employee_sessions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        session_token_hash CHAR(64) NOT NULL,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,

        INDEX idx_employee_id (employee_id),
        INDEX idx_session_token_hash (session_token_hash),
        INDEX idx_expires_at (expires_at),

        CONSTRAINT fk_employee_sessions_employee
          FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "employee_devices",
    query: `
      CREATE TABLE IF NOT EXISTS employee_devices (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        player_id VARCHAR(255) NULL,
        device_type VARCHAR(50) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uniq_player_id (player_id),
        INDEX idx_employee_id (employee_id),
        INDEX idx_device_type (device_type),
        INDEX idx_employee_active (employee_id, is_active),

        CONSTRAINT fk_employee_devices_employee
          FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "employee_deactivation_reasons",
    query: `
      CREATE TABLE IF NOT EXISTS employee_deactivation_reasons (
          id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          employee_id BIGINT NOT NULL,
          category VARCHAR(50) NOT NULL,
          reason TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          INDEX idx_employee_id (employee_id),

          CONSTRAINT fk_employee_deactivation
              FOREIGN KEY (employee_id)
              REFERENCES employees(id)
              ON DELETE CASCADE
      );
    `
  }
];

const initEmployeeTables = async () => {
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

initEmployeeTables();
