// Cloudflare Pages Function: /api/upload
// รองรับการอัปโหลดรูปภาพสลิป หรือหลักฐานปลาเสียหาย/เคลมสินค้า (รองรับ Base64 ขนาดสูงสุด 10MB)
// จัดเก็บลง Cloudflare D1 ในตาราง claim_media หรือตอบกลับ Data URL

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { base64Data, filename, claimId } = body;

    if (!base64Data) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No image data provided'
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const id = 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const cleanFilename = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, '_') : `${id}.jpg`;
    
    // หากมีการผูก D1 database ให้บันทึกลงตาราง claim_media
    if (env && env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS claim_media (
            id TEXT PRIMARY KEY,
            claim_id TEXT,
            filename TEXT,
            content_type TEXT,
            data_base64 TEXT NOT NULL,
            file_size INTEGER,
            created_at TEXT NOT NULL
          )
        `).run();

        await env.DB.prepare(`
          INSERT INTO claim_media (id, claim_id, filename, content_type, data_base64, file_size, created_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        `).bind(
          id,
          claimId || null,
          cleanFilename,
          base64Data.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
          base64Data,
          base64Data.length,
          now
        ).run();
      } catch (dbErr) {
        console.warn('Could not persist media to D1, returning data URL directly:', dbErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mediaId: id,
      imageUrl: base64Data, // เก็บและแสดงผลผ่าน Data URL ได้ทันทีโดยไม่ต้องพึ่งพา file system
      message: 'Upload processed successfully'
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
