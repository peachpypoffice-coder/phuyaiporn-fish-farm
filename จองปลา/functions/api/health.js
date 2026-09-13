// Cloudflare Pages Function: /api/health
// ตรวจสอบการทำงานของเซิร์ฟเวอร์ Cloudflare และสถานะฐานข้อมูล D1

export async function onRequestGet({ env }) {
  let dbStatus = 'not_configured';
  let dbRows = 0;

  if (env && env.DB) {
    try {
      const result = await env.DB.prepare("SELECT count(*) as count FROM app_state").first();
      dbStatus = 'connected';
      dbRows = result ? result.count : 0;
    } catch (e) {
      dbStatus = 'error: ' + e.message;
    }
  }

  const payload = {
    status: 'ok',
    server: 'Cloudflare Pages Functions',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      stateRecords: dbRows
    }
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
