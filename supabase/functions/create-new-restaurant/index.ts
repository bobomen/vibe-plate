import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateRestaurantRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  cuisine_type?: string;
  price_range?: number;
  website?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const restaurantData: CreateRestaurantRequest = await req.json();

    console.log('Creating new restaurant:', { name: restaurantData.name, user_id: user.id });

    // 验证必填字段
    if (!restaurantData.name || !restaurantData.address || !restaurantData.phone || !restaurantData.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, address, phone, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 创建新餐厅记录
    const { data: newRestaurant, error: insertError } = await supabaseClient
      .from('restaurants')
      .insert({
        name: restaurantData.name,
        address: restaurantData.address,
        phone: restaurantData.phone,
        city: restaurantData.city,
        district: restaurantData.district,
        lat: restaurantData.lat,
        lng: restaurantData.lng,
        cuisine_type: restaurantData.cuisine_type,
        price_range: restaurantData.price_range,
        website: restaurantData.website,
        description: restaurantData.description,
        // 新创建的餐厅设置为待验证状态
        is_verified: false,
        view_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating restaurant:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create restaurant', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Restaurant created successfully:', { restaurant_id: newRestaurant.id });

    // 检查用户是否有待处理的新餐厅认领（restaurant_id 为 null）
    const { data: existingClaim } = await supabaseClient
      .from('restaurant_claims')
      .select('*')
      .eq('user_id', user.id)
      .is('restaurant_id', null)
      .eq('status', 'verified')
      .maybeSingle();

    // 如果存在已验证的新餐厅认领，将其关联到新创建的餐厅
    if (existingClaim) {
      const { error: updateClaimError } = await supabaseClient
        .from('restaurant_claims')
        .update({ 
          restaurant_id: newRestaurant.id,
          contact_email: restaurantData.email,
          contact_phone: restaurantData.phone,
        })
        .eq('id', existingClaim.id);

      if (updateClaimError) {
        console.error('Error updating claim with restaurant_id:', updateClaimError);
        // 不影响餐厅创建，只记录错误
      } else {
        console.log('Updated claim with new restaurant_id:', { claim_id: existingClaim.id, restaurant_id: newRestaurant.id });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Restaurant created successfully',
        restaurant: newRestaurant
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-new-restaurant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
