import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyClaimRequest {
  restaurant_id?: string;
  verification_code: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and validate JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create anon client for auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔒 速率限制：防止验证码暴力破解
    // 限制：每个用户 15 分钟内最多尝试 10 次
    const rateLimitResult = checkRateLimit({
      windowMs: 15 * 60 * 1000,  // 15分钟
      maxRequests: 10,            // 最多10次
      identifier: `verify-claim:${user.id}`
    });

    if (!rateLimitResult.allowed) {
      console.log(`[Rate Limit] User ${user.id} exceeded verify-claim limit`);
      return createRateLimitResponse(
        `驗證嘗試次數過多，請在 ${rateLimitResult.retryAfter} 秒後重試`,
        rateLimitResult.retryAfter!,
        corsHeaders
      );
    }

    console.log(`[Rate Limit] User ${user.id} - Remaining: ${rateLimitResult.remaining}/10`);

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { restaurant_id, verification_code }: VerifyClaimRequest = await req.json();

    console.log('Verifying claim:', { restaurant_id, code: verification_code, user_id: user.id });

    // 查找验证码记录 - use admin client
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from('restaurant_verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', verification_code)
      .eq('used', false)
      .maybeSingle();

    if (codeError) {
      console.error('Error fetching verification code:', codeError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!codeRecord) {
      console.log('Verification code not found or already used');
      return new Response(
        JSON.stringify({ error: 'Invalid verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查验证码是否匹配餐厅ID（对于现有餐厅）
    if (restaurant_id && codeRecord.restaurant_id !== restaurant_id) {
      console.log('Restaurant ID mismatch');
      return new Response(
        JSON.stringify({ error: 'Verification code does not match this restaurant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查验证码是否过期
    const expiresAt = new Date(codeRecord.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      console.log('Verification code expired:', { expires_at: expiresAt, now });
      return new Response(
        JSON.stringify({ error: 'Verification code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 标记验证码为已使用
    const { error: updateCodeError } = await supabaseAdmin
      .from('restaurant_verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id);

    if (updateCodeError) {
      console.error('Error updating verification code:', updateCodeError);
      return new Response(
        JSON.stringify({ error: 'Failed to mark code as used' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 查找对应的认领记录
    let claimQuery = supabaseAdmin
      .from('restaurant_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (restaurant_id) {
      claimQuery = claimQuery.eq('restaurant_id', restaurant_id);
    } else {
      claimQuery = claimQuery.is('restaurant_id', null);
    }

    const { data: claimRecord, error: claimError } = await claimQuery.maybeSingle();

    if (claimError) {
      console.error('Error fetching claim record:', claimError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!claimRecord) {
      console.log('No pending claim found for this user');
      return new Response(
        JSON.stringify({ error: 'No pending claim found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 更新认领记录状态为 verified
    const { error: updateClaimError } = await supabaseAdmin
      .from('restaurant_claims')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', claimRecord.id);

    if (updateClaimError) {
      console.error('Error updating claim status:', updateClaimError);
      return new Response(
        JSON.stringify({ error: 'Failed to update claim status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取要认领的餐厅ID（可能来自参数或claim记录）
    const targetRestaurantId = restaurant_id || codeRecord.restaurant_id;

    if (!targetRestaurantId) {
      console.error('No restaurant ID found for claim');
      return new Response(
        JSON.stringify({ error: 'No restaurant ID associated with this claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 创建 restaurant_owners 记录
    const { data: existingOwner, error: ownerCheckError } = await supabaseAdmin
      .from('restaurant_owners')
      .select('id')
      .eq('restaurant_id', targetRestaurantId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (ownerCheckError) {
      console.error('Error checking existing owner:', ownerCheckError);
      // 不阻断流程，只记录错误
    }

    // 如果不存在，创建新记录
    if (!existingOwner) {
      const { error: createOwnerError } = await supabaseAdmin
        .from('restaurant_owners')
        .insert({
          user_id: user.id,
          restaurant_id: targetRestaurantId,
          verified: true,
        });

      if (createOwnerError) {
        console.error('Error creating restaurant owner:', createOwnerError);
        return new Response(
          JSON.stringify({ error: 'Failed to create restaurant owner record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Restaurant owner created:', { user_id: user.id, restaurant_id: targetRestaurantId });
    } else {
      console.log('Restaurant owner already exists:', { user_id: user.id, restaurant_id: targetRestaurantId });
    }

    // 更新餐厅的 verified_at 时间戳
    const { error: updateRestaurantError } = await supabaseAdmin
      .from('restaurants')
      .update({ 
        verified_at: new Date().toISOString()
      })
      .eq('id', targetRestaurantId);

    if (updateRestaurantError) {
      console.error('Error updating restaurant verified_at:', updateRestaurantError);
      // 不阻断流程，只记录错误
    }

    console.log('Claim verified successfully:', { claim_id: claimRecord.id, restaurant_id: targetRestaurantId });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification successful',
        claim_id: claimRecord.id,
        restaurant_id: targetRestaurantId,
        status: 'verified'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-restaurant-claim function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
