import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// ✅ Schema 驗證
// ============================================================

interface PhotoReference {
  reference: string;
  width?: number;
  height?: number;
}

interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
  };
}

interface RestaurantInput {
  google_place_id?: string;
  name: string;
  address?: string;
  city?: string;
  district?: string;
  lat: number;
  lng: number;
  google_rating?: number;
  google_reviews_count?: number;
  price_range?: number;
  google_types?: string[];
  photo_references?: PhotoReference[];
  photos?: string[]; // 舊格式相容
  phone?: string;
  website?: string;
  google_maps_url?: string;
  business_hours?: BusinessHours;
  michelin_stars?: number;
  has_500_dishes?: boolean;
  bib_gourmand?: boolean;
}

// ============================================================
// ✅ 配置常數
// ============================================================

const MAX_BATCH_SIZE = 100; // 單次最多處理 100 筆
const DUPLICATE_CHECK_RADIUS = 0.0005; // 約 50 公尺

// 台灣座標範圍 (用於驗證)
const TAIWAN_LAT_RANGE = { min: 21.5, max: 26.5 };
const TAIWAN_LNG_RANGE = { min: 119.5, max: 122.5 };

// ============================================================
// ✅ 驗證函數
// ============================================================

function validateRestaurant(restaurant: RestaurantInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必要欄位
  if (!restaurant.name || typeof restaurant.name !== 'string' || restaurant.name.trim() === '') {
    errors.push('缺少餐廳名稱');
  }

  if (typeof restaurant.lat !== 'number' || isNaN(restaurant.lat)) {
    errors.push('緯度必須是有效數字');
  }

  if (typeof restaurant.lng !== 'number' || isNaN(restaurant.lng)) {
    errors.push('經度必須是有效數字');
  }

  // 座標範圍驗證 (台灣)
  if (typeof restaurant.lat === 'number' && typeof restaurant.lng === 'number') {
    if (restaurant.lat < TAIWAN_LAT_RANGE.min || restaurant.lat > TAIWAN_LAT_RANGE.max) {
      errors.push(`緯度超出台灣範圍: ${restaurant.lat}`);
    }
    if (restaurant.lng < TAIWAN_LNG_RANGE.min || restaurant.lng > TAIWAN_LNG_RANGE.max) {
      errors.push(`經度超出台灣範圍: ${restaurant.lng}`);
    }
  }

  // 可選欄位範圍驗證
  if (restaurant.google_rating !== undefined && restaurant.google_rating !== null) {
    if (restaurant.google_rating < 0 || restaurant.google_rating > 5) {
      errors.push(`評分超出範圍 (0-5): ${restaurant.google_rating}`);
    }
  }

  if (restaurant.price_range !== undefined && restaurant.price_range !== null) {
    if (restaurant.price_range < 1 || restaurant.price_range > 5) {
      errors.push(`價格範圍超出範圍 (1-5): ${restaurant.price_range}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// ✅ 照片處理函數
// ============================================================

function processPhotoReferences(photoRefs: PhotoReference[] | undefined, googlePlaceApiKey: string | undefined): string[] {
  if (!photoRefs || photoRefs.length === 0) {
    return [];
  }

  // 如果有 Google API Key，生成代理 URL
  // 否則返回空陣列（稍後由前端或其他服務處理）
  if (googlePlaceApiKey) {
    // 使用 Edge Function 代理 URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    return photoRefs.map(ref => 
      `${supabaseUrl}/functions/v1/google-place-photo?reference=${encodeURIComponent(ref.reference)}&maxwidth=800`
    );
  }

  // 沒有 API Key 時，儲存 photo reference 以供後續處理
  // 可以考慮儲存為 JSON 或使用其他格式
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ✅ Authentication & Authorization Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '需要身份驗證' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '身份驗證失敗' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: '需要管理員權限' }), 
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { restaurants } = await req.json();
    console.log('[import-restaurants] Processing import request');

    if (!Array.isArray(restaurants) || restaurants.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid restaurants data: must be a non-empty array'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ✅ 批次大小限制
    if (restaurants.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `批次大小超過限制: 最多 ${MAX_BATCH_SIZE} 筆，您提交了 ${restaurants.length} 筆`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[import-restaurants] Processing ${restaurants.length} restaurants`);

    const results: Array<{
      name: string;
      success: boolean;
      id?: string;
      error?: string;
      skipped?: boolean;
      skipReason?: string;
    }> = [];
    
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;
    let validationFailCount = 0;

    // Process each restaurant
    for (const restaurant of restaurants as RestaurantInput[]) {
      try {
        console.log(`[import-restaurants] Processing: ${restaurant.name}`);

        // ✅ Schema 驗證
        const validation = validateRestaurant(restaurant);
        if (!validation.valid) {
          validationFailCount++;
          results.push({
            name: restaurant.name || '(未知)',
            success: false,
            error: `驗證失敗: ${validation.errors.join(', ')}`
          });
          continue;
        }

        // ✅ 去重檢查：使用名稱 + 座標
        const { data: existingRestaurants, error: checkError } = await supabase
          .from('restaurants')
          .select('id, name')
          .ilike('name', restaurant.name)
          .gte('lat', restaurant.lat - DUPLICATE_CHECK_RADIUS)
          .lte('lat', restaurant.lat + DUPLICATE_CHECK_RADIUS)
          .gte('lng', restaurant.lng - DUPLICATE_CHECK_RADIUS)
          .lte('lng', restaurant.lng + DUPLICATE_CHECK_RADIUS)
          .is('deleted_at', null)
          .limit(1);

        if (checkError) {
          console.error('[import-restaurants] Duplicate check error:', checkError.message);
        }

        if (existingRestaurants && existingRestaurants.length > 0) {
          duplicateCount++;
          results.push({
            name: restaurant.name,
            success: false,
            skipped: true,
            skipReason: `已存在相同餐廳 (ID: ${existingRestaurants[0].id})`
          });
          console.log(`[import-restaurants] Skipped duplicate: ${restaurant.name}`);
          continue;
        }

        // ✅ 處理照片
        let photos: string[] = [];
        if (restaurant.photo_references && restaurant.photo_references.length > 0) {
          photos = processPhotoReferences(restaurant.photo_references, GOOGLE_PLACES_API_KEY);
        } else if (restaurant.photos && restaurant.photos.length > 0) {
          // 相容舊格式，但過濾掉含 API Key 的 URL
          photos = restaurant.photos.filter(url => !url.includes('key='));
        }

        // Insert restaurant
        const { data: insertData, error: insertError } = await supabase
          .from('restaurants')
          .insert({
            name: restaurant.name.trim(),
            address: restaurant.address || '',
            city: restaurant.city || null,
            district: restaurant.district || null,
            lat: restaurant.lat,
            lng: restaurant.lng,
            google_rating: restaurant.google_rating || null,
            google_reviews_count: restaurant.google_reviews_count || 0,
            michelin_stars: restaurant.michelin_stars || 0,
            has_500_dishes: restaurant.has_500_dishes || false,
            bib_gourmand: restaurant.bib_gourmand || false,
            photos: photos,
            cuisine_type: '其他', // Default, will be classified by AI
            price_range: restaurant.price_range || 2,
            phone: restaurant.phone || null,
            website: restaurant.website || null,
            google_maps_url: restaurant.google_maps_url || null,
            business_hours: restaurant.business_hours || null,
            status: 'active'
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        console.log(`[import-restaurants] Inserted: ${restaurant.name} (ID: ${insertData.id})`);

        // Trigger AI classification
        try {
          const classifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/classify-restaurant-cuisine`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              restaurantId: insertData.id,
              name: restaurant.name,
              address: restaurant.address,
              googleTypes: restaurant.google_types || null
            }),
          });

          if (!classifyResponse.ok) {
            console.warn(`[import-restaurants] Classification failed for ${restaurant.name}`);
          } else {
            console.log(`[import-restaurants] Classification complete for ${restaurant.name}`);
          }
        } catch (classifyError) {
          console.warn(`[import-restaurants] Classification error for ${restaurant.name}:`, classifyError);
        }

        successCount++;
        results.push({
          name: restaurant.name,
          success: true,
          id: insertData.id
        });

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        results.push({
          name: restaurant.name || '(未知)',
          success: false,
          error: `匯入失敗: ${errorMessage}`
        });
        console.error(`[import-restaurants] Failed to import ${restaurant.name}:`, errorMessage);
      }
    }

    console.log(`[import-restaurants] Import complete: ${successCount} success, ${failCount} failed, ${duplicateCount} duplicates, ${validationFailCount} validation errors`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: restaurants.length,
          successCount,
          failCount,
          duplicateCount,
          validationFailCount
        },
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    console.error('[import-restaurants] Error:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: `操作失敗: ${errorMessage}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
