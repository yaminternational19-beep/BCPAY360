import db from "../config/db.js";

const TABLES = [
  {
    name: "notifications",
    query: `
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,

        /* =========================
           OWNERSHIP
        ========================= */
        company_id BIGINT NOT NULL,
        branch_id BIGINT NULL,

        /* =========================
           TARGET USER
        ========================= */
        user_type VARCHAR(30) NOT NULL,
        user_id BIGINT NOT NULL,

        /* =========================
           CONTENT
        ========================= */
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,

        notification_type VARCHAR(100) NULL,
        reference_id BIGINT NULL,
        reference_type VARCHAR(100) NULL,

        action_url VARCHAR(255) NULL,

        /* =========================
           STATE
        ========================= */
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        is_deleted TINYINT(1) NOT NULL DEFAULT 0,

        /* =========================
           DELIVERY TRACKING
        ========================= */
        is_push_sent TINYINT(1) NOT NULL DEFAULT 0,
        push_sent_at TIMESTAMP NULL,

        /* =========================
           AUDIT
        ========================= */
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        /* =========================
           INDEXES
        ========================= */
        KEY idx_company (company_id),
        KEY idx_user (user_type, user_id),
        KEY idx_user_unread (user_type, user_id, is_read),
        KEY idx_user_deleted (user_type, user_id, is_deleted),
        KEY idx_created (created_at)
      );
    `
  }
];

const initNotificationTables = async () => {
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

initNotificationTables();
