import db from "../config/db.js";

const TABLES = [
  {
    name: "company_faqs",
    query: `
      CREATE TABLE IF NOT EXISTS company_faqs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_id BIGINT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );
    `
  },
  {
    name: "broadcasts",
    query: `
      CREATE TABLE IF NOT EXISTS broadcasts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_id BIGINT NOT NULL,
        branch_id BIGINT NULL,
        audience_type ENUM('ALL', 'BRANCH', 'EMPLOYEE') NOT NULL,
        message TEXT NOT NULL,
        employee_ids JSON NULL,
        created_by_role VARCHAR(50) NOT NULL,
        created_by_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      );
    `
  },
  {
    name: "company_pages",
    query: `
      CREATE TABLE IF NOT EXISTS company_pages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_id BIGINT NOT NULL,
        slug VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NULL,
        content_type VARCHAR(50) DEFAULT 'MARKDOWN',
        is_system TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_by BIGINT NOT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uq_company_slug (company_id, slug),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );
    `
  },
  {
    name: "company_support_tickets",
    query: `
      CREATE TABLE IF NOT EXISTS company_support_tickets (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_id BIGINT NOT NULL,
        employee_id BIGINT NOT NULL,
        branch_id BIGINT NOT NULL,
        category VARCHAR(100) NOT NULL,
        status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
        response TEXT NULL,
        responded_by_role VARCHAR(50) NULL,
        responded_by_id BIGINT NULL,
        responded_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      );
    `
  }
];

const initSettingsTables = async () => {
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

initSettingsTables();
