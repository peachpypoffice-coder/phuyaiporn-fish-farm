-- ==========================================================
-- Cloudflare D1 Database Schema
-- บจก.สุทธิ อินเตอร์ ฟาร์ม (ฟาร์มปลาผู้ใหญ่พร)
-- ==========================================================

-- 1. ตารางเก็บ State หลักของระบบ (Orders, Customers, Claims, Drivers, Permissions)
-- ใช้เป็น Single-Source-of-Truth เพื่อให้การซิงค์ข้ามอุปกรณ์และ Offline-First ทำงานได้ 100%
CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. ตารางเก็บรูปภาพ/ไฟล์หลักฐานการเคลม (Media Storage บน D1)
CREATE TABLE IF NOT EXISTS claim_media (
    id TEXT PRIMARY KEY,
    claim_id TEXT,
    filename TEXT,
    content_type TEXT,
    data_base64 TEXT NOT NULL,
    file_size INTEGER,
    created_at TEXT NOT NULL
);

-- 3. ตารางประวัติบันทึกการกระทำ (Audit Log) สำหรับตรวจสอบย้อนหลัง
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT,
    details TEXT,
    created_at TEXT NOT NULL
);

-- 4. Initial Seed Row (ถ้ายังไม่มีข้อมูล)
INSERT OR IGNORE INTO app_state (key, value, updated_at) 
VALUES ('global_state', '{}', datetime('now', '+7 hours'));
