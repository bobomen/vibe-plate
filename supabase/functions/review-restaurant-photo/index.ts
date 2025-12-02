import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoId, photoUrl } = await req.json();

    if (!photoId || !photoUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing photoId or photoUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Reviewing photo ${photoId}: ${photoUrl}`);

    // 呼叫 Lovable AI Gateway (Gemini Vision)
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
            role: 'user',
            content: [
              {
                type: 'text',
                text: `分析這張圖片，判斷是否適合作為餐廳照片。請回傳 JSON 格式：
{
  "approved": true/false,
  "category": "food" | "interior" | "exterior" | "menu" | "other" | "inappropriate",
  "reason": "簡短說明（繁體中文）",
  "confidence": 0.0-1.0
}

判斷標準：
1. 是否為餐廳、食物、菜單或用餐環境相關？
2. 是否包含明顯不當內容（暴力、色情、仇恨言論）？
3. 圖片品質是否可接受？

如果是明顯不當內容，設定 approved: false, category: "inappropriate"。
如果無法確定，設定 approved: true（商家付費功能，預設信任）。`
              },
              {
                type: 'image_url',
                image_url: {
                  url: photoUrl
                }
              }
            ]
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // AI 審核失敗，預設通過
      return new Response(
        JSON.stringify({
          approved: true,
          category: 'other',
          reason: 'AI 審核暫時無法使用，預設通過',
          confidence: 0.5,
          fallback: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    // 解析 AI 回應
    let reviewResult;
    try {
      const content = aiData.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reviewResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // 解析失敗，預設通過
      reviewResult = {
        approved: true,
        category: 'other',
        reason: 'AI 審核結果解析失敗，預設通過',
        confidence: 0.5,
        fallback: true
      };
    }

    // 更新資料庫
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const newStatus = reviewResult.approved ? 'active' : 'rejected';
    
    const { error: updateError } = await supabase
      .from('restaurant_photos')
      .update({
        status: newStatus,
        ai_review_result: reviewResult,
        ai_reviewed_at: new Date().toISOString(),
      })
      .eq('id', photoId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log(`Photo ${photoId} review complete: ${newStatus}`);

    return new Response(
      JSON.stringify({
        ...reviewResult,
        status: newStatus,
        photoId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in review-restaurant-photo:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        approved: true,
        fallback: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
