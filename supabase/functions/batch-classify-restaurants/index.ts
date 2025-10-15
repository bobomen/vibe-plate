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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    const { batchSize = 10, offset = 0 } = await req.json();
    console.log('[batch-classify] Processing batch');

    // Fetch unclassified or "其他" restaurants
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, address')
      .or('cuisine_type.eq.其他,ai_classified_at.is.null')
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error('[batch-classify] Fetch error');
      throw fetchError;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('[batch-classify] No restaurants to classify');
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No restaurants to classify'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[batch-classify] Processing restaurants:', restaurants.length);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Process restaurants sequentially to avoid rate limits
    for (const restaurant of restaurants) {
      try {
        console.log('[batch-classify] Classifying restaurant');

        // Call classify-restaurant-cuisine function
        const classifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/classify-restaurant-cuisine`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            googleTypes: null
          }),
        });

        if (!classifyResponse.ok) {
          throw new Error(`Classification failed: ${classifyResponse.status}`);
        }

        const classifyData = await classifyResponse.json();
        
        if (classifyData.success) {
          successCount++;
          results.push({
            id: restaurant.id,
            name: restaurant.name,
            success: true,
            classification: classifyData.classification
          });
          console.log('[batch-classify] Classification successful');
        } else {
          throw new Error(classifyData.error || 'Unknown error');
        }

        // Add delay to avoid rate limits (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failCount++;
        results.push({
          id: restaurant.id,
          name: restaurant.name,
          success: false,
          error: '分類失敗'
        });
        console.error('[batch-classify] Classification failed');
      }
    }

    console.log('[batch-classify] Batch complete');

    return new Response(
      JSON.stringify({
        success: true,
        processed: restaurants.length,
        successCount,
        failCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[batch-classify] Error');
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
