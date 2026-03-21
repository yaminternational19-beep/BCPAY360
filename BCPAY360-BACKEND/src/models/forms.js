import db from "../config/db.js";

/**
 * Employee Form Documents Model
 * Usage: node src/models/forms.js
 */
const TABLES = [
  {
    name: "employee_form_documents", // Using this name to match controller logic
    query: `
      CREATE TABLE IF NOT EXISTS employee_form_documents (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        employee_id BIGINT NOT NULL,

        -- classification (FORM or REPORT)
        doc_type VARCHAR(50) NOT NULL,

        -- form identifier
        form_code VARCHAR(50) NOT NULL,

        -- period control
        period_type ENUM('FY','MONTH') NOT NULL,

        financial_year VARCHAR(9) NULL,   -- required if FY (e.g., 2024-2025)
        doc_year INT NULL,                -- required if MONTH
        doc_month TINYINT NULL,           -- 1–12

        -- storage
        storage_provider ENUM('S3','LOCAL') NOT NULL DEFAULT 'S3',
        storage_bucket VARCHAR(100) NOT NULL,
        storage_object_key VARCHAR(255) NOT NULL, -- Renamed from storage_key to match controller

        -- visibility
        is_employee_visible TINYINT(1) DEFAULT 1,

        -- audit
        uploaded_by_role ENUM('EMPLOYEE','HR','COMPANY_ADMIN','SUPER_ADMIN') NOT NULL,
        uploaded_by_id BIGINT NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- uniqueness
        UNIQUE KEY uq_document (
          employee_id,
          form_code,
          period_type,
          doc_year,
          doc_month,
          financial_year
        ),

        -- constraints
        CONSTRAINT fk_form_doc_employee
          FOREIGN KEY (employee_id)
          REFERENCES employees(id)
          ON DELETE CASCADE
      );
    `
  }
];

const initFormTables = async () => {
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

initFormTables();
