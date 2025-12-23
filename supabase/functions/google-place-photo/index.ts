import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Google Place Photo 安全代理
 * 
 * 此 Edge Function 作為 Google Places Photos API 的安全代理，
 * 避免在前端暴露 API Key。
 * 
 * 使用方式：
 * GET /functions/v1/google-place-photo?reference=PHOTO_REFERENCE&maxwidth=800
 * 
 * 參數：
 * - reference: Google Photo Reference（必要）
 * - maxwidth: 最大寬度（選填，預設 800，最大 1600）
 * - maxheight: 最大高度（選填）
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// 快取控制：照片可快取 7 天
const CACHE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// 限制最大尺寸
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const DEFAULT_WIDTH = 800;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: '只允許 GET 請求' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!GOOGLE_PLACES_API_KEY) {
      console.error('[google-place-photo] Missing GOOGLE_PLACES_API_KEY');
      return new Response(
        JSON.stringify({ error: '服務未配置' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 解析 URL 參數
    const url = new URL(req.url);
    const photoReference = url.searchParams.get('reference');
    let maxWidth = parseInt(url.searchParams.get('maxwidth') || String(DEFAULT_WIDTH));
    let maxHeight = url.searchParams.get('maxheight') ? parseInt(url.searchParams.get('maxheight')!) : undefined;

    // 驗證必要參數
    if (!photoReference) {
      return new Response(
        JSON.stringify({ error: '缺少 reference 參數' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 驗證 photo reference 格式（基本安全檢查）
    if (!/^[A-Za-z0-9_-]+$/.test(photoReference)) {
      return new Response(
        JSON.stringify({ error: '無效的 reference 格式' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 限制尺寸
    maxWidth = Math.min(Math.max(1, maxWidth), MAX_WIDTH);
    if (maxHeight) {
      maxHeight = Math.min(Math.max(1, maxHeight), MAX_HEIGHT);
    }

    // 構建 Google Places Photo API URL
    let googleUrl = `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${photoReference}&maxwidth=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`;
    
    if (maxHeight) {
      googleUrl += `&maxheight=${maxHeight}`;
    }

    console.log(`[google-place-photo] Fetching photo: reference=${photoReference.substring(0, 20)}...`);

    // 請求 Google API
    const response = await fetch(googleUrl, {
      headers: {
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      console.error(`[google-place-photo] Google API error: ${response.status}`);
      
      // 根據錯誤碼返回適當的錯誤
      if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: '無效的照片參考' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'API 權限不足' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: '無法取得照片' }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 取得圖片內容
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    console.log(`[google-place-photo] Success: ${imageBuffer.byteLength} bytes, type: ${contentType}`);

    // 返回圖片，設定快取
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    console.error('[google-place-photo] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: '服務暫時不可用' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
