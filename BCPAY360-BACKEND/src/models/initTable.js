import db from "../config/db.js";

/**
 * Database Initialization Script
 * Consolidates all table creation logic to prevent repetition.
 */
const TABLES = [
    {
        name: "super_admin",
        query: `
            CREATE TABLE IF NOT EXISTS super_admin (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_super_admin_email UNIQUE (email)
            );
        `
    },
    {
        name: "fake_table",
        query: `
            CREATE TABLE IF NOT EXISTS fake_table (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(150) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `
    },
    {
        name: "super_admin_otps",
        query: `
            CREATE TABLE IF NOT EXISTS super_admin_otps (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                super_admin_id BIGINT NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expires_at DATETIME NOT NULL,
                is_used TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_super_admin_otp
                  FOREIGN KEY (super_admin_id)
                  REFERENCES super_admin(id)
                  ON DELETE CASCADE
            );
        `
    },
    {
        name: "companies",
        query: `
            CREATE TABLE IF NOT EXISTS companies (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_by BIGINT NOT NULL,
                last_login_at TIMESTAMP NULL,
                timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
                logo_url TEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_companies_email UNIQUE (email),
                CONSTRAINT fk_companies_created_by
                    FOREIGN KEY (created_by)
                    REFERENCES super_admin(id)
                    ON DELETE RESTRICT
            );
        `
    },
    {
        name: "auth_otps",
        query: `
            CREATE TABLE IF NOT EXISTS auth_otps (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                user_type ENUM('COMPANY_ADMIN', 'HR') NOT NULL,
                user_id BIGINT NOT NULL,

                email VARCHAR(255) NOT NULL,

                otp_hash VARCHAR(255) NOT NULL,

                expires_at DATETIME NOT NULL,

                is_used TINYINT(1) NOT NULL DEFAULT 0,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_user (user_type, user_id),
                INDEX idx_email (email),
                INDEX idx_expiry (expires_at)
            );
        `
    }
];

const initDatabase = async () => {
    try {
        console.log("🚀 Starting database initialization...");
        
        for (const table of TABLES) {
            console.log(`   Initializing ${table.name}...`);
            await db.query(table.query);
        }

        console.log("✅ All tables are ready.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Initialization failed:", error.message);
        process.exit(1);
    }
};

initDatabase();