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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get batch size from request body (default: 50)
    const { batchSize = 50 } = await req.json().catch(() => ({}));

    console.log(`Starting migrated users creation process (batch size: ${batchSize})...`);

    // First, count total pending profiles
    const { count: totalPending } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('migrated', true)
      .is('user_id', null);

    console.log(`Total pending profiles: ${totalPending}`);

    // Fetch only a batch of migrated profiles without user_id
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('migrated', true)
      .is('user_id', null)
      .limit(batchSize);

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} migrated profiles to process in this batch`);

    const results = {
      batchSize: profiles?.length || 0,
      created: 0,
      errors: [] as any[],
      totalPending: totalPending || 0,
      remainingAfterBatch: Math.max(0, (totalPending || 0) - (profiles?.length || 0))
    };

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No migrated profiles found without user_id',
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each profile
    for (const profile of profiles) {
      try {
        console.log(`Processing profile: ${profile.dni} - ${profile.email}`);

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: profile.email,
          password: '1234',
          email_confirm: true,
          user_metadata: {
            requires_password_change: true,
            dni: profile.dni,
            first_name: profile.first_name,
            last_name: profile.last_name
          }
        });

        if (authError) {
          console.error(`Error creating user for ${profile.email}:`, authError);
          results.errors.push({
            profile_id: profile.id,
            email: profile.email,
            dni: profile.dni,
            error: authError.message
          });
          continue;
        }

        console.log(`Created auth user: ${authUser.user.id}`);

        // Update profile with user_id
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ user_id: authUser.user.id })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Error updating profile ${profile.id}:`, updateError);
          results.errors.push({
            profile_id: profile.id,
            email: profile.email,
            dni: profile.dni,
            error: `Profile update failed: ${updateError.message}`
          });
          continue;
        }

        // Create docente role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: 'docente'
          });

        if (roleError) {
          console.error(`Error creating role for ${authUser.user.id}:`, roleError);
          results.errors.push({
            profile_id: profile.id,
            email: profile.email,
            dni: profile.dni,
            error: `Role creation failed: ${roleError.message}`
          });
          continue;
        }

        results.created++;
        console.log(`Successfully processed: ${profile.email}`);
      } catch (error) {
        console.error(`Unexpected error processing profile ${profile.id}:`, error);
        results.errors.push({
          profile_id: profile.id,
          email: profile.email,
          dni: profile.dni,
          error: error.message
        });
      }
    }

    console.log('Migration complete:', results);

    const successRate = results.batchSize > 0 ? Math.round((results.created / results.batchSize) * 100) : 0;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Procesados ${results.batchSize} perfiles: ${results.created} creados exitosamente (${successRate}%). ${results.remainingAfterBatch} perfiles pendientes.`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});