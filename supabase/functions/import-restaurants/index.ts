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
    const { restaurants } = await req.json();
    console.log('[import-restaurants] Processing import');

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

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Process each restaurant
    for (const restaurant of restaurants) {
      try {
        console.log('[import-restaurants] Processing restaurant');

        // Validate required fields
        if (!restaurant.name || !restaurant.lat || !restaurant.lng) {
          throw new Error('Missing required fields: name, lat, lng');
        }

        // Insert restaurant
        const { data: insertData, error: insertError } = await supabase
          .from('restaurants')
          .insert({
            name: restaurant.name,
            address: restaurant.address || '',
            city: restaurant.city || null,
            district: restaurant.district || null,
            lat: restaurant.lat,
            lng: restaurant.lng,
            google_rating: restaurant.google_rating || 0,
            google_reviews_count: restaurant.google_reviews_count || 0,
            michelin_stars: restaurant.michelin_stars || 0,
            has_500_dishes: restaurant.has_500_dishes || false,
            bib_gourmand: restaurant.bib_gourmand || false,
            photos: restaurant.photos || [],
            cuisine_type: '其他', // Default, will be classified by AI
            price_range: restaurant.price_range || 2,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        console.log('[import-restaurants] Restaurant inserted');

        // Trigger AI classification
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
          console.warn('[import-restaurants] Classification failed');
        } else {
          console.log('[import-restaurants] Classification complete');
        }

        successCount++;
        results.push({
          name: restaurant.name,
          success: true,
          id: insertData.id
        });

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 150));

      } catch (error) {
        failCount++;
        results.push({
          name: restaurant.name,
          success: false,
          error: '匯入失敗'
        });
        console.error('[import-restaurants] Import failed');
      }
    }

    console.log('[import-restaurants] Import complete');

    return new Response(
      JSON.stringify({
        success: true,
        imported: restaurants.length,
        successCount,
        failCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[import-restaurants] Error');
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
