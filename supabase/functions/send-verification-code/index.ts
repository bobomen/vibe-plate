import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendVerificationRequest {
  restaurant_id?: string;
  claim_type: 'existing' | 'new';
  contact_email: string;
  restaurant_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token (remove 'Bearer ' prefix)
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Create a client with ANON_KEY to verify the user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user's JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User verification failed:', userError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated successfully:', user.id);

    // 🔒 速率限制：防止邮件轰炸攻击
    // 限制：每个用户 15 分钟内最多发送 5 次验证码
    const rateLimitResult = checkRateLimit({
      windowMs: 15 * 60 * 1000,  // 15分钟
      maxRequests: 5,             // 最多5次
      identifier: `send-code:${user.id}`
    });

    if (!rateLimitResult.allowed) {
      console.log(`[Rate Limit] User ${user.id} exceeded send-verification-code limit`);
      return createRateLimitResponse(
        `請求過於頻繁，請在 ${rateLimitResult.retryAfter} 秒後重試`,
        rateLimitResult.retryAfter!,
        corsHeaders
      );
    }

    console.log(`[Rate Limit] User ${user.id} - Remaining: ${rateLimitResult.remaining}/5`);

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { restaurant_id, claim_type, contact_email, restaurant_name }: SendVerificationRequest = await req.json();

    console.log('Sending verification code for:', { restaurant_id, claim_type, contact_email, user_id: user.id });

    // Check for existing pending claim
    let existingClaimQuery = supabaseAdmin
      .from('restaurant_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (restaurant_id) {
      existingClaimQuery = existingClaimQuery.eq('restaurant_id', restaurant_id);
    } else {
      existingClaimQuery = existingClaimQuery.is('restaurant_id', null);
    }

    const { data: existingClaim } = await existingClaimQuery.maybeSingle();

    let claim;
    if (existingClaim) {
      // Update existing claim
      const { data: updatedClaim, error: updateError } = await supabaseAdmin
        .from('restaurant_claims')
        .update({ 
          contact_email,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingClaim.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating claim:', updateError);
      } else {
        console.log('Claim updated:', updatedClaim.id);
        claim = updatedClaim;
      }
    } else {
      // Create new claim
      const claimData: any = {
        user_id: user.id,
        claim_type,
        status: 'pending',
        contact_email,
      };

      if (restaurant_id) {
        claimData.restaurant_id = restaurant_id;
      }

      const { data: newClaim, error: insertError } = await supabaseAdmin
        .from('restaurant_claims')
        .insert(claimData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating claim:', insertError);
      } else {
        console.log('Claim created:', newClaim.id);
        claim = newClaim;
      }
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 设置过期时间（15分钟后）
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 存储验证码到数据库
    const { error: insertError } = await supabaseAdmin
      .from('restaurant_verification_codes')
      .insert({
        restaurant_id: restaurant_id || null,
        user_id: user.id,
        code,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('Error inserting verification code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 发送验证码邮件
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>餐厅认领验证码</h1>
            </div>
            <div class="content">
              <p>您好，</p>
              <p>您正在认领餐厅：<strong>${restaurant_name}</strong></p>
              <p>请使用以下验证码完成认领流程：</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p><strong>注意：</strong>此验证码将在 <strong>15分钟</strong>后过期。</p>
              <p>如果您没有发起此操作，请忽略此邮件。</p>
              <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'Lovable <onboarding@resend.dev>',
      to: [contact_email],
      subject: `餐厅认领验证码: ${code}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verification code sent successfully:', { code, email: contact_email });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent successfully',
        expires_at: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-verification-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
