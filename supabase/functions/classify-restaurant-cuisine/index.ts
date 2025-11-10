import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
    const { restaurantId, name, address, googleTypes } = await req.json();
    console.log('[classify-restaurant-cuisine] Processing classification');

    // Construct classification prompt
    const prompt = `
你是一個專業的餐廳菜系分類專家。請根據以下資訊判斷餐廳的菜系類型和地理位置：

餐廳名稱：${name}
餐廳地址：${address}
Google Places 類型：${googleTypes || '無'}

任務 1：菜系分類
請從以下選項中選擇最合適的一個菜系類型：
- chinese（中式）：中國各地菜系，包括粵菜、川菜、湘菜等
- taiwanese（台式）：台灣本地特色料理
- japanese（日式）：日本料理、壽司、拉麵等
- korean（韓式）：韓國料理、烤肉等
- thai（泰式）：泰國料理
- american（美式）：美式漢堡、牛排等
- italian（義式）：義大利麵、披薩等
- french（法式）：法國料理
- mediterranean（地中海）：地中海料理
- other（其他）：不屬於以上任何類型

任務 2：地址解析
請從地址中提取縣市（city）和區域（district）。
範例：
- "台北市大安區復興南路123號" → city: "台北市", district: "大安區"
- "新北市板橋區中山路100號" → city: "新北市", district: "板橋區"
- "台中市西屯區台灣大道99號" → city: "台中市", district: "西屯區"

注意：統一使用「台」而非「臺」，例如「台北市」而非「臺北市」

任務 3：飲食選項判斷（多維度分析）
請綜合以下信息判斷餐廳是否提供特定飲食選項：

**1. 餐廳名稱分析**
- vegetarian（素食）：包含「素」、「蔬」、「齋」、"vegetarian"、"veggie"
- vegan（純素）：包含「純素」、「全素」、「蔬食」、"vegan"、"plant-based"
- halal（清真）：包含「清真」、「回教」、"halal"、"muslim"
- gluten_free（無麩質）：包含「無麩質」、"gluten free"、"GF"

**2. Google Places Types 分析**
${googleTypes ? `Google 標記：${googleTypes}` : '無 Google 標記'}
- 如果包含 "vegetarian_restaurant" → vegetarian: true
- 如果包含 "vegan_restaurant" → vegan: true  
- 如果包含 "halal_restaurant" → halal: true

**3. 菜系類型推斷**
根據菜系判斷可能提供的飲食選項：
- 印度料理（indian）→ 通常提供素食選項（vegetarian）
- 中東料理（mediterranean）→ 可能提供清真選項（halal）
- 日式料理（japanese）→ 可能提供素食選項，但較少純素
- 台式/中式素食專門店 → vegetarian 和 vegan
- 泰式料理（thai）→ 可能提供素食選項

**4. 保守判斷原則**
- 如果沒有明確證據，請設為 false（避免誤導有特殊需求的用戶）
- 只有在以下情況才設為 true：
  * 餐廳名稱明確包含相關關鍵字，或
  * Google Places Types 明確標記，或
  * 菜系類型強烈暗示（例如：名為"XX素食館"的台式餐廳）

請以 JSON 格式回應，包含：
{
  "cuisine_type": "選擇的菜系類型",
  "city": "縣市名稱（例如：台北市）",
  "district": "區域名稱（例如：大安區）",
  "confidence": 0.85,
  "reasoning": "簡短說明分類理由（中文）",
  "dietary_options": {
    "vegetarian": true/false,
    "vegan": true/false,
    "halal": true/false,
    "gluten_free": true/false
  },
  "dietary_reasoning": "說明飲食選項判斷依據（中文，50字內）"
}

如果無法從地址中提取 city 或 district，請設為 null。
`.trim();

    console.log('[classify-restaurant-cuisine] Calling AI service');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: '你是一個專業的餐廳菜系分類專家。請根據餐廳資訊準確分類菜系類型，並以 JSON 格式回應。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      console.error('[classify-restaurant-cuisine] AI service error');
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('[classify-restaurant-cuisine] Classification received');

    const classification = JSON.parse(content);

    // Update restaurant in database
    if (restaurantId) {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          cuisine_type: classification.cuisine_type,
          city: classification.city || null,
          district: classification.district || null,
          dietary_options: classification.dietary_options || {},
          ai_classified_at: new Date().toISOString(),
          ai_confidence: classification.confidence
        })
        .eq('id', restaurantId);

      if (updateError) {
        console.error('[classify-restaurant-cuisine] Database update error');
        throw updateError;
      }

      console.log('[classify-restaurant-cuisine] Restaurant updated successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        classification: {
          cuisine_type: classification.cuisine_type,
          city: classification.city || null,
          district: classification.district || null,
          dietary_options: classification.dietary_options || {},
          confidence: classification.confidence,
          reasoning: classification.reasoning
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[classify-restaurant-cuisine] Error');
    return new Response(
      JSON.stringify({
        success: false,
        error: '操作失敗，請稍後重試'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
