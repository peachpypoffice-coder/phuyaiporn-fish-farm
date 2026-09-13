# คู่มือการนำระบบฟาร์มปลาขึ้น Cloudflare Hosting & D1 Database (ฉบับสมบูรณ์)
**บจก.สุทธิ อินเตอร์ ฟาร์ม (ฟาร์มปลาผู้ใหญ่พร)**

ระบบถูกออกแบบมาให้รองรับ **Cloudflare Pages + Serverless Functions + Cloudflare D1 Database** 100% โดยไม่มีค่าใช้จ่ายรายเดือน (Free Tier) รันได้ 24 ชั่วโมง ข้อมูลซิงค์อัตโนมัติระหว่างมือถือคนขับรถ, คอมพิวเตอร์ออฟฟิศ และแท็บเล็ตของผู้ใหญ่พร

---

## 🚀 สรุปขั้นตอนใน 5 นาที

คุณสามารถนำขึ้น Cloudflare ได้ 2 วิธี (เลือกวิธีที่สะดวกที่สุด):

---

### 🌟 วิธีที่ 1: ผ่านหน้าเว็บไซต์ Cloudflare Dashboard (ง่ายที่สุด ไม่ต้องพิมพ์คำสั่ง)

#### ขั้นตอนที่ 1: เข้าสู่ระบบ Cloudflare
1. เปิดเว็บบราวเซอร์ไปที่ [dash.cloudflare.com](https://dash.cloudflare.com)
2. เข้าสู่ระบบ หรือสมัครบัญชีใหม่ (ฟรี)

#### ขั้นตอนที่ 2: สร้างฐานข้อมูล Cloudflare D1
1. ที่เมนูด้านซ้าย เลือก **Storage & Databases** → **D1 SQL Database**
2. กดปุ่ม **Create database**
3. ตั้งชื่อ Database Name: `phuyaiporn-db`
5. ในหน้า Database ที่สร้างเสร็จ ให้กดแท็บ **Console** 
   - **ต้องคัดลอก "ข้อความโค้ดด้านในไฟล์" มาวางครับ (ไม่ใช่พิมพ์แค่ชื่อไฟล์)**
   - หรือคัดลอกโค้ด SQL สำเร็จรูปด้านล่างนี้ไปวางในช่อง Console ได้ทันทีเลยครับ:

```sql
-- 1. ตารางเก็บ State หลักของระบบ (Orders, Customers, Claims, Drivers, Permissions)
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

-- 3. ตารางประวัติบันทึกการกระทำ (Audit Log)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT,
    details TEXT,
    created_at TEXT NOT NULL
);

-- 4. ข้อมูลเริ่มต้น
INSERT OR IGNORE INTO app_state (key, value, updated_at) 
VALUES ('global_state', '{}', datetime('now', '+7 hours'));
```
6. เมื่อวางเสร็จแล้ว กดปุ่ม **Execute** ด้านล่าง เป็นอันเสร็จสิ้นการตั้งค่าฐานข้อมูล!
1. ที่เมนูด้านซ้าย เลือก **Compute (Workers & Pages)** → **Create application**
2. เลือกแท็บ **Pages**
3. เลือกได้ 2 แบบ:
   - **แบบ Direct Upload (ลากโฟลเดอร์วาง)**:
     - ตั้งชื่อโปรเจกต์: `phuyaiporn-fish-farm`
     - ลากโฟลเดอร์ `จองปลา` ทั้งหมดขึ้นไปวาง แล้วกด **Deploy site**
   - **หรือเชื่อมต่อผ่าน GitHub (แนะนำสำหรับอัปเดตอัตโนมัติ)**:
     - Push โปรเจกต์ขึ้น GitHub Repo ของคุณ
     - เลือก Repository `จองปลา`
     - Build output directory ให้ใส่: `.` หรือปล่อยว่าง
     - กด **Save and Deploy**

#### ขั้นตอนที่ 4: ผูกฐานข้อมูล D1 เข้ากับเว็บแอป (Database Binding)
1. ในหน้าโปรเจกต์ Pages ที่เพิ่งสร้างเสร็จ ไปที่แท็บ **Settings** → **Functions**
2. เลื่อนลงมาที่หัวข้อ **D1 Database Bindings**
3. กดปุ่ม **Add binding**
   - **Variable name**: ใส่คำว่า `DB` (ตัวพิมพ์ใหญ่ทั้งหมด)
   - **D1 database**: เลือก `phuyaiporn-db`
4. กด **Save**
5. ไปที่แท็บ **Deployments** แล้วกด **Retry deployment** หรือสร้าง deployment ใหม่อีกครั้งเพื่อให้ Functions เริ่มเชื่อมต่อกับฐานข้อมูล
6. **เสร็จสิ้น!** คุณจะได้ลิงก์เว็บไซต์ เช่น `https://phuyaiporn-fish-farm.pages.dev` ที่สามารถเปิดใช้งานได้จากมือถือและทุกที่ทั่วโลก 24 ชั่วโมง

---

### 💻 วิธีที่ 2: ผ่าน Wrangler CLI (สำหรับผู้พัฒนา / คำสั่งเดียวจบ)

หากในเครื่องมี Node.js และเปิด Terminal ได้:

```bash
# 1. ล็อกอินเข้า Cloudflare
npx wrangler login

# 2. สร้างฐานข้อมูล D1
npx wrangler d1 create phuyaiporn-db

# (นำ database_id ที่ได้ มาใส่ในไฟล์ wrangler.toml)

# 3. รัน Schema สร้างตารางใน D1
npx wrangler d1 execute phuyaiporn-db --file=schema.sql --remote

# 4. Deploy หน้าเว็บและ Functions ขึ้น Cloudflare Pages ทันที
npx wrangler pages deploy . --project-name phuyaiporn-fish-farm
```

---

## 📱 จุดเด่นของระบบเมื่อขึ้น Cloudflare

1. **เชื่อมต่อ D1 อัตโนมัติ**: ทุกการสร้างออเดอร์, อัปเดตสถานะจัดส่ง, เปลี่ยนสิทธิ์ CEO, เพิ่มคนขับรถ หรือแจ้งเคลมสินค้า จะถูกส่งไปบันทึกลง D1 ทันทีผ่าน `/api/state`
2. **Offline-First Resilience**: มีระบบบันทึกสำรองในเครื่อง (`localStorage`) หากสัญญาณอินเทอร์เน็ตของคนขับรถหลุด ระบบยังคงทำงานได้ปกติ และจะขึ้นไฟสถานะ `โหมดออฟไลน์` เมื่อสัญญาณกลับมาจะซิงค์ข้อมูลกับคลาวด์ใหม่อัตโนมัติ
3. **สถานะคลาวด์บนหน้าจอ**: มีป้าย `🟢 คลาวด์ออนไลน์` แสดงอยู่ที่มุมบนขวา เพื่อให้ผู้ใหญ่พรและทีมงานมั่นใจได้ตลอดเวลาว่าข้อมูลกำลังซิงค์ขึ้น Cloudflare อยู่จริง
4. **ความเร็วสูงทั่วโลก**: โหลดผ่าน CDN ทั่วโลกของ Cloudflare หน้าเว็บจะเปิดติดในเสี้ยววินาทีแม้เน็ตมือถือจะช้า

---

## 🛠️ รายชื่อไฟล์ที่เตรียมไว้ให้ในระบบ

- `wrangler.toml` : ไฟล์คอนฟิก Cloudflare Pages และ D1 Binding
- `schema.sql` : โครงสร้างตาราง SQL สำหรับ Cloudflare D1
- `functions/api/state.js` : Serverless Function สำหรับอ่าน/เขียนฐานข้อมูล D1
- `functions/api/upload.js` : Serverless Function สำหรับอัปโหลดไฟล์รูปภาพและหลักฐานเคลม
- `functions/api/health.js` : Endpoint ตรวจสอบสถานะการเชื่อมต่อ D1
- `logo.svg` : ไฟล์โลโก้ฟาร์มปลาผู้ใหญ่พรแบบ Vector คมชัดทุกความละเอียด
