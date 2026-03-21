import db from "../config/db.js";

/**
 * Organization Tables Initialization Script
 * Run this file to create all organization-related tables.
 * Usage: node src/models/organization.js
 */

const TABLES = [
    {
        name: "branches",
        query: `
            CREATE TABLE IF NOT EXISTS branches (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                company_id BIGINT NOT NULL,
                branch_code VARCHAR(20),
                branch_name VARCHAR(150) NOT NULL,
                branch_type VARCHAR(50) NULL,
                location VARCHAR(100),
                address TEXT,
                phone VARCHAR(20),
                email VARCHAR(150),
                timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
                attendance_grace_minutes INT NOT NULL DEFAULT 0,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_by_admin_id BIGINT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT uq_company_branch_code UNIQUE (company_id, branch_code),
                CONSTRAINT fk_branches_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                CONSTRAINT fk_branches_created_by
                    FOREIGN KEY (created_by_admin_id)
                    REFERENCES companies(id)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            );
        `
    },
    {
        name: "employee_code_configs",
        query: `
            CREATE TABLE IF NOT EXISTS employee_code_configs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                company_id BIGINT NOT NULL,
                branch_id BIGINT NOT NULL,

                last_employee_code VARCHAR(50) NOT NULL,
                current_sequence INT NOT NULL DEFAULT 0,

                is_active TINYINT(1) NOT NULL DEFAULT 1,

                created_by_role ENUM('COMPANY_ADMIN', 'HR') NOT NULL,
                created_by_id BIGINT NOT NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                UNIQUE KEY uq_company_branch (company_id, branch_id),

                CONSTRAINT fk_empcode_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_empcode_branch
                    FOREIGN KEY (branch_id)
                    REFERENCES branches(id)
                    ON DELETE CASCADE
            );
        `
    },
    {
        name: "departments",
        query: `
            CREATE TABLE IF NOT EXISTS departments (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                company_id BIGINT NOT NULL,
                branch_id BIGINT NOT NULL,

                department_name VARCHAR(100) NOT NULL,
                department_code VARCHAR(30) NULL,

                parent_department_id BIGINT NULL,

                head_employee_id BIGINT NULL,

                is_active TINYINT(1) NOT NULL DEFAULT 1,

                created_by_admin_id BIGINT NOT NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT uq_branch_department UNIQUE (branch_id, department_name),

                KEY idx_company (company_id),
                KEY idx_branch (branch_id),
                KEY idx_created_by (created_by_admin_id),
                KEY idx_parent_department (parent_department_id),

                CONSTRAINT fk_departments_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                CONSTRAINT fk_departments_branch
                    FOREIGN KEY (branch_id)
                    REFERENCES branches(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                CONSTRAINT fk_departments_admin
                    FOREIGN KEY (created_by_admin_id)
                    REFERENCES companies(id)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE,

                CONSTRAINT fk_departments_parent
                    FOREIGN KEY (parent_department_id)
                    REFERENCES departments(id)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
            );
        `
    },
    {
        name: "designations",
        query: `
            CREATE TABLE IF NOT EXISTS designations (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                company_id BIGINT NOT NULL,
                branch_id BIGINT NOT NULL,
                department_id BIGINT NOT NULL,

                designation_name VARCHAR(100) NOT NULL,
                designation_code VARCHAR(30) NULL,

                level_rank INT NULL,
                is_managerial TINYINT(1) NOT NULL DEFAULT 0,

                is_active TINYINT(1) NOT NULL DEFAULT 1,

                created_by_role ENUM('COMPANY_ADMIN', 'HR') NOT NULL,
                created_by_id BIGINT NOT NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT uq_dept_designation UNIQUE (department_id, designation_name),

                KEY idx_company (company_id),
                KEY idx_branch (branch_id),
                KEY idx_department (department_id),

                CONSTRAINT fk_designations_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                CONSTRAINT fk_designations_branch
                    FOREIGN KEY (branch_id)
                    REFERENCES branches(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                CONSTRAINT fk_designations_department
                    FOREIGN KEY (department_id)
                    REFERENCES departments(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        `
    },
    {
        name: "employee_types",
        query: `
            CREATE TABLE IF NOT EXISTS employee_types (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                company_id BIGINT NOT NULL,
                branch_id BIGINT NOT NULL,

                type_name VARCHAR(100) NOT NULL,
                type_code VARCHAR(30) NULL,

                is_payroll_applicable TINYINT(1) NOT NULL DEFAULT 1,
                is_attendance_applicable TINYINT(1) NOT NULL DEFAULT 1,

                is_active TINYINT(1) NOT NULL DEFAULT 1,

                created_by_role ENUM('COMPANY_ADMIN', 'HR') NOT NULL,
                created_by_id BIGINT NOT NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT uq_branch_type UNIQUE (branch_id, type_name),

                KEY idx_company (company_id),
                KEY idx_branch (branch_id),

                CONSTRAINT fk_employee_types_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                CONSTRAINT fk_employee_types_branch
                    FOREIGN KEY (branch_id)
                    REFERENCES branches(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        `
    },
    {
        name: "shifts",
        query: `
            CREATE TABLE IF NOT EXISTS shifts (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                company_id BIGINT NOT NULL,
                branch_id BIGINT NOT NULL,

                shift_name VARCHAR(100) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,

                grace_minutes INT NOT NULL DEFAULT 0,
                min_half_day_minutes INT NOT NULL DEFAULT 0,
                min_full_day_minutes INT NOT NULL DEFAULT 0,

                is_night_shift TINYINT(1) NOT NULL DEFAULT 0,
                late_after_minutes INT NOT NULL DEFAULT 10
                COMMENT 'Minutes after shift start to mark late',   

                description VARCHAR(255),

                is_active TINYINT(1) NOT NULL DEFAULT 1,

                created_by_role ENUM('COMPANY_ADMIN', 'HR') NOT NULL,
                created_by_id BIGINT NOT NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT uq_branch_shift UNIQUE (branch_id, shift_name),

                KEY idx_company (company_id),
                KEY idx_branch (branch_id),

                CONSTRAINT fk_shifts_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,

                CONSTRAINT fk_shifts_branch
                    FOREIGN KEY (branch_id)
                    REFERENCES branches(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
        `
    },
    {
        name: "company_documents",
        query: `
            CREATE TABLE IF NOT EXISTS company_documents (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                company_id BIGINT NOT NULL,

                document_code VARCHAR(50) NOT NULL,

                document_name VARCHAR(150) NOT NULL,

                description TEXT NULL,

                uploaded_by BIGINT NOT NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                UNIQUE KEY uq_company_document_code (company_id, document_code),

                KEY idx_company_id (company_id),

                CONSTRAINT fk_company_documents_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE
            );
        `
    },
    {
        name: "hr_users",
        query: `
            CREATE TABLE IF NOT EXISTS hr_users (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                company_id BIGINT NOT NULL,
                branch_id BIGINT NOT NULL,

                hr_code VARCHAR(30) NOT NULL,

                full_name VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL,
                country_code VARCHAR(10) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,

                role VARCHAR(50) DEFAULT 'HR',

                joining_date DATE NOT NULL,
                experience_years DECIMAL(4,1) NULL,
                job_location VARCHAR(150) NULL,

                gender VARCHAR(20) NULL,
                dob DATE NULL,
                emergency_contact_name VARCHAR(150) NULL,
                emergency_country_code VARCHAR(10) NULL,
                emergency_contact_number VARCHAR(20) NULL,
                remarks VARCHAR(255) NULL,

                is_active TINYINT(1) DEFAULT 1,
                force_password_reset TINYINT(1) DEFAULT 1,
                last_login_at TIMESTAMP NULL,

                created_by BIGINT NOT NULL,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                -- constraints
                UNIQUE KEY uq_company_hr_code (company_id, branch_id, hr_code),
                UNIQUE KEY uq_company_email (company_id, email),
                UNIQUE KEY uq_company_phone (company_id, country_code, phone_number),

                -- indexes
                KEY idx_company (company_id),
                KEY idx_branch (branch_id),

                -- foreign keys
                CONSTRAINT fk_hr_company
                    FOREIGN KEY (company_id)
                    REFERENCES companies(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_hr_branch
                    FOREIGN KEY (branch_id)
                    REFERENCES branches(id)
                    ON DELETE CASCADE
            );
        `
    },
    {
        name: "hr_permissions",
        query: `
            CREATE TABLE IF NOT EXISTS hr_permissions (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                hr_id BIGINT NOT NULL,

                module_key VARCHAR(100) NOT NULL,
                allowed TINYINT(1) DEFAULT 0,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                UNIQUE KEY uq_hr_module (hr_id, module_key),

                KEY idx_hr (hr_id),

                CONSTRAINT fk_hr_permissions_hr
                    FOREIGN KEY (hr_id)
                    REFERENCES hr_users(id)
                    ON DELETE CASCADE
            );
        `
    }

];

const initOrganization = async () => {
    try {
        for (const table of TABLES) {
            await db.query(table.query);
        }
        process.exit(0);
    } catch (error) {
        console.error("❌ Organization initialization failed:", error.message);
        process.exit(1);
    }
};

initOrganization();
