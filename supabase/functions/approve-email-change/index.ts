import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create client with user's token to verify permissions
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verify user is super_admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (!roles) {
      throw new Error('Only super admins can approve email changes');
    }

    const { requestId, newEmail, userId } = await req.json();

    if (!requestId || !newEmail || !userId) {
      throw new Error('Missing required parameters');
    }

    console.log(`Approving email change for user ${userId} to ${newEmail}`);

    // 1. Update email in auth.users using Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (authError) {
      throw new Error(`Failed to update auth.users: ${authError.message}`);
    }

    console.log('Updated auth.users email');

    // 2. Update email in profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail })
      .eq('user_id', userId);

    if (profileError) {
      throw new Error(`Failed to update profiles: ${profileError.message}`);
    }

    console.log('Updated profiles email');

    // 3. Mark request as approved
    const { error: requestError } = await supabaseAdmin
      .from('email_change_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        admin_notes: 'Cambio aprobado y aplicado correctamente'
      })
      .eq('id', requestId);

    if (requestError) {
      throw new Error(`Failed to update request: ${requestError.message}`);
    }

    console.log('Email change approved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: error.message.includes('Unauthorized') || error.message.includes('super admin') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});