import db from "../config/db.js";

/**
 * Payroll Management Tables
 * Usage: node src/models/payroll.js
 */
const TABLES = [
  {
    name: "payroll_batches",
    query: `
      CREATE TABLE IF NOT EXISTS payroll_batches (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        company_id BIGINT NOT NULL,
        branch_id BIGINT NULL,

        pay_month INT NOT NULL,
        pay_year INT NOT NULL,

        period_start DATE NULL,
        period_end DATE NULL,

        status ENUM('DRAFT','CONFIRMED','LOCKED') DEFAULT 'DRAFT',

        created_by_role ENUM('HR','COMPANY_ADMIN','SUPER_ADMIN') NOT NULL,
        created_by_id BIGINT NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        generated_at TIMESTAMP NULL,
        confirmed_at TIMESTAMP NULL,

        UNIQUE KEY uq_company_month (company_id, pay_month, pay_year),

        FOREIGN KEY (company_id) REFERENCES companies(id)
      );
    `
  },
  {
    name: "payroll_employee_entries",
    query: `
      CREATE TABLE IF NOT EXISTS payroll_employee_entries (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        payroll_batch_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,

        base_salary DECIMAL(12,2) NOT NULL,

        present_days DECIMAL(5,2) NOT NULL DEFAULT 0,
        absent_days DECIMAL(5,2) DEFAULT 0,
        leave_days DECIMAL(5,2) DEFAULT 0,
        payable_days DECIMAL(5,2) DEFAULT 0,

        late_days INT DEFAULT 0,

        ot_hours DECIMAL(6,2) DEFAULT 0,

        bonus DECIMAL(10,2) DEFAULT 0,
        incentive DECIMAL(10,2) DEFAULT 0,
        other_deductions DECIMAL(10,2) DEFAULT 0,

        pf_applicable TINYINT(1) DEFAULT 0,
        pf_amount DECIMAL(10,2) DEFAULT 0,

        gross_salary DECIMAL(12,2) NOT NULL,
        net_salary DECIMAL(12,2) NOT NULL,

        attendance_snapshot JSON NULL,
        calculation_breakdown JSON NULL,

        payment_status ENUM('PENDING','PROCESSING','SUCCESS','FAILED')
          DEFAULT 'PENDING',
        
        paid_at TIMESTAMP NULL,

        salary_slip_key VARCHAR(255) NULL,

        is_locked TINYINT(1) DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY uq_batch_employee (payroll_batch_id, employee_id),

        FOREIGN KEY (payroll_batch_id)
          REFERENCES payroll_batches(id)
          ON DELETE CASCADE,

        FOREIGN KEY (employee_id)
          REFERENCES employees(id)
      );
    `
  },
  {
    name: "employee_payslips",
    query: `
      CREATE TABLE IF NOT EXISTS employee_payslips (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        payroll_employee_entry_id BIGINT NOT NULL,

        payslip_number VARCHAR(50) NOT NULL,

        storage_provider VARCHAR(30) DEFAULT 'S3',
        storage_bucket VARCHAR(100) NOT NULL,
        storage_key VARCHAR(255) NOT NULL,

        email_sent TINYINT(1) DEFAULT 0,

        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY uq_entry (payroll_employee_entry_id),

        FOREIGN KEY (payroll_employee_entry_id)
          REFERENCES payroll_employee_entries(id)
          ON DELETE CASCADE
      );
    `
  },
  {
    name: "payroll_payment_logs",
    query: `
      CREATE TABLE IF NOT EXISTS payroll_payment_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        payroll_employee_entry_id BIGINT NOT NULL,

        bank_name VARCHAR(150),
        account_number_masked VARCHAR(20),
        transaction_ref VARCHAR(100),

        status ENUM('SUCCESS','FAILED') NOT NULL,
        message VARCHAR(255),

        retry_count INT DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (payroll_employee_entry_id)
          REFERENCES payroll_employee_entries(id)
          ON DELETE CASCADE
      );
    `
  }
];

const initPayrollTables = async () => {
  try {
    console.log("🚀 Starting payroll tables initialization...");
    for (const table of TABLES) {
      console.log(`   Initializing ${table.name}...`);
      await db.query(table.query);
    }
    console.log("✅ All payroll tables are ready.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
    process.exit(1);
  }
};

initPayrollTables();
