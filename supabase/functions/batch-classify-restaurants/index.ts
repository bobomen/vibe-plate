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
    const { batchSize = 10, offset = 0 } = await req.json();
    console.log('[batch-classify] Starting batch classification:', { batchSize, offset });

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch unclassified or "其他" restaurants
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, address')
      .or('cuisine_type.eq.其他,ai_classified_at.is.null')
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error('[batch-classify] Fetch error:', fetchError);
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

    console.log('[batch-classify] Processing', restaurants.length, 'restaurants');

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Process restaurants sequentially to avoid rate limits
    for (const restaurant of restaurants) {
      try {
        console.log('[batch-classify] Classifying:', restaurant.name);

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
          console.log('[batch-classify] Success:', restaurant.name, '→', classifyData.classification.cuisine_type);
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
          error: error.message
        });
        console.error('[batch-classify] Failed:', restaurant.name, error);
      }
    }

    console.log('[batch-classify] Batch complete:', { successCount, failCount });

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
    console.error('[batch-classify] Error:', error);
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