// Cloudflare Pages Function: /api/state
// จัดการดึงและบันทึกข้อมูลหลักของฟาร์ม (Orders, Customers, Claims, Drivers, Permissions)
// เชื่อมต่อกับ Cloudflare D1 Database โดยตรง

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

// Handle OPTIONS for CORS Preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

// GET /api/state: ดึงข้อมูลล่าสุดจาก D1 Database
export async function onRequestGet({ env }) {
  try {
    if (!env || !env.DB) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Cloudflare D1 Database binding "DB" is not configured yet.'
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // ตรวจสอบและสร้างตารางหากยังไม่มี
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `).run();

    const row = await env.DB.prepare("SELECT value, updated_at FROM app_state WHERE key = 'global_state'").first();

    if (!row || !row.value || row.value === '{}') {
      return new Response(JSON.stringify({
        success: false,
        message: 'No stored state in D1. App will use client seed data.'
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    const stateData = JSON.parse(row.value);

    return new Response(JSON.stringify({
      success: true,
      data: stateData,
      updatedAt: row.updated_at
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

// POST /api/state: บันทึกข้อมูล Orders, Customers, Claims, Drivers, Permissions ลง D1
export async function onRequestPost({ request, env }) {
  try {
    if (!env || !env.DB) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Cloudflare D1 Database binding "DB" is not configured yet.'
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }

    const payload = await request.json();

    // ดึง state เดิมที่มีอยู่ขึ้นมา merge (ป้องกันข้อมูลสูญหายหากส่งมาเฉพาะบาง field)
    let currentState = {};
    try {
      const existing = await env.DB.prepare("SELECT value FROM app_state WHERE key = 'global_state'").first();
      if (existing && existing.value) {
        currentState = JSON.parse(existing.value);
      }
    } catch (_) {
      // Ignore if table or record doesn't exist yet
    }

    const mergedState = {
      ...currentState,
      orders: payload.orders !== undefined ? payload.orders : (currentState.orders || []),
      customers: payload.customers !== undefined ? payload.customers : (currentState.customers || []),
      claims: payload.claims !== undefined ? payload.claims : (currentState.claims || []),
      drivers: payload.drivers !== undefined ? payload.drivers : (currentState.drivers || []),
      permissions: payload.permissions !== undefined ? payload.permissions : (currentState.permissions || null),
      updatedAt: new Date().toISOString()
    };

    const stateJson = JSON.stringify(mergedState);
    const now = new Date().toISOString();

    // Upsert ลง D1
    await env.DB.prepare(`
      INSERT INTO app_state (key, value, updated_at) 
      VALUES ('global_state', ?1, ?2)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value, 
        updated_at = excluded.updated_at
    `).bind(stateJson, now).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Saved to Cloudflare D1 successfully',
      updatedAt: now
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
