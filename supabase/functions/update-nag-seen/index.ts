import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Invalid user token");
    }

    // 🔒 速率限制：防止频繁请求
    // 限制：每个用户 1 小时内最多 20 次
    const rateLimitResult = checkRateLimit({
      windowMs: 60 * 60 * 1000,   // 1小时
      maxRequests: 20,             // 最多20次
      identifier: `update-nag:${userData.user.id}`
    });

    if (!rateLimitResult.allowed) {
      console.log(`[Rate Limit] User ${userData.user.id} exceeded update-nag limit`);
      return createRateLimitResponse(
        `更新過於頻繁，請在 ${rateLimitResult.retryAfter} 秒後重試`,
        rateLimitResult.retryAfter!,
        corsHeaders
      );
    }

    console.log(`[Rate Limit] User ${userData.user.id} - Remaining: ${rateLimitResult.remaining}/20`);

    // Update last_nag_at timestamp
    const { error } = await supabaseClient.rpc('update_nag_seen', {
      user_uuid: userData.user.id
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, updated_at: new Date().toISOString() }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating nag seen");
    return new Response(
      JSON.stringify({ error: "操作失敗，請稍後重試" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});