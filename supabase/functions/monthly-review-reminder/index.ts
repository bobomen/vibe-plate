import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);
    
    console.log(`Checking for active users from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Find all users who had activity last month
    const { data: activeUsers, error: swipesError } = await supabase
      .from('user_swipes')
      .select('user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (swipesError) {
      console.error('Error fetching active users:', swipesError);
      throw swipesError;
    }

    const uniqueUserIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];
    
    console.log(`Found ${uniqueUserIds.length} active users last month`);
    
    // TODO: Send push notifications or emails to these users
    // This is where you would integrate with:
    // - Firebase Cloud Messaging for push notifications
    // - SendGrid/Resend for email notifications
    // - Or any other notification service
    
    // For now, we just log the user IDs
    console.log('User IDs to notify:', uniqueUserIds);

    return new Response(JSON.stringify({ 
      success: true, 
      userCount: uniqueUserIds.length,
      message: `Identified ${uniqueUserIds.length} users for monthly review reminders`
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in monthly-review-reminder:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  }
});
