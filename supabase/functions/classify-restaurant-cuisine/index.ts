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
    const { restaurantId, name, address, googleTypes } = await req.json();
    console.log('[classify-restaurant-cuisine] Processing:', { restaurantId, name, address });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

任務 3：飲食選項判斷
請根據餐廳名稱判斷是否提供以下飲食選項（如果名稱中包含相關關鍵字則為 true，否則為 false）：
- vegetarian（素食）：名稱包含「素」、「蔬」等
- vegan（純素）：名稱包含「純素」、「全素」等
- halal（清真）：名稱包含「清真」、「回教」等
- gluten_free（無麩質）：名稱包含「無麩質」等

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
  }
}

如果無法從地址中提取 city 或 district，請設為 null。
`.trim();

    console.log('[classify-restaurant-cuisine] Calling Lovable AI...');

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
      const errorText = await aiResponse.text();
      console.error('[classify-restaurant-cuisine] AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('[classify-restaurant-cuisine] AI response:', content);

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
        console.error('[classify-restaurant-cuisine] Database update error:', updateError);
        throw updateError;
      }

      console.log('[classify-restaurant-cuisine] Successfully updated restaurant:', restaurantId);
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
    console.error('[classify-restaurant-cuisine] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});