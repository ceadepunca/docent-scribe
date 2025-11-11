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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting email cleanup process...');

    const results = {
      step1_comas: { count: 0, emails: [] as string[] },
      step2_espacios: { count: 0, emails: [] as string[] },
      step3_sin_arroba: { count: 0, emails: [] as string[] },
      step4_sin_dominio: { count: 0, emails: [] as string[] },
      errors: [] as any[],
    };

    // Step 1: Fix emails with commas
    console.log('Step 1: Fixing emails with commas...');
    const { data: profilesWithCommas } = await supabase
      .from('profiles')
      .select('id, dni, email')
      .is('user_id', null)
      .eq('migrated', true)
      .like('email', '%,%');

    if (profilesWithCommas) {
      for (const profile of profilesWithCommas) {
        const cleanEmail = profile.email.replace(/,/g, '.');
        const { error } = await supabase
          .from('profiles')
          .update({ email: cleanEmail })
          .eq('id', profile.id);
        
        if (error) {
          results.errors.push({ step: 1, dni: profile.dni, error: error.message });
        } else {
          results.step1_comas.count++;
          results.step1_comas.emails.push(`${profile.dni}: ${profile.email} → ${cleanEmail}`);
        }
      }
    }

    // Step 2: Remove spaces from emails
    console.log('Step 2: Removing spaces from emails...');
    const { data: profilesWithSpaces } = await supabase
      .from('profiles')
      .select('id, dni, email')
      .is('user_id', null)
      .eq('migrated', true)
      .or('email.like.% %');

    if (profilesWithSpaces) {
      for (const profile of profilesWithSpaces) {
        // Remove all spaces and non-breaking spaces
        const cleanEmail = profile.email.trim().replace(/\s+/g, '').replace(/\u00A0/g, '');
        const { error } = await supabase
          .from('profiles')
          .update({ email: cleanEmail })
          .eq('id', profile.id);
        
        if (error) {
          results.errors.push({ step: 2, dni: profile.dni, error: error.message });
        } else {
          results.step2_espacios.count++;
          results.step2_espacios.emails.push(`${profile.dni}: ${profile.email} → ${cleanEmail}`);
        }
      }
    }

    // Step 3: Fix emails without @ but ending in gmail.com or hotmail.com
    console.log('Step 3: Fixing emails without @...');
    const { data: profilesWithoutAt } = await supabase
      .from('profiles')
      .select('id, dni, email')
      .is('user_id', null)
      .eq('migrated', true)
      .not('email', 'like', '%@%');

    if (profilesWithoutAt) {
      for (const profile of profilesWithoutAt) {
        let cleanEmail = profile.email;
        
        // Try to fix common patterns
        if (cleanEmail.includes('gmail.com')) {
          cleanEmail = cleanEmail.replace(/gmail\.com/, '@gmail.com');
        } else if (cleanEmail.includes('hotmail.com')) {
          cleanEmail = cleanEmail.replace(/hotmail\.com/, '@hotmail.com');
        } else if (cleanEmail.includes('outlook.com')) {
          cleanEmail = cleanEmail.replace(/outlook\.com/, '@outlook.com');
        } else if (cleanEmail.includes('yahoo.com')) {
          cleanEmail = cleanEmail.replace(/yahoo\.com/, '@yahoo.com');
        }
        
        // Only update if we actually fixed something
        if (cleanEmail !== profile.email && cleanEmail.includes('@')) {
          const { error } = await supabase
            .from('profiles')
            .update({ email: cleanEmail })
            .eq('id', profile.id);
          
          if (error) {
            results.errors.push({ step: 3, dni: profile.dni, error: error.message });
          } else {
            results.step3_sin_arroba.count++;
            results.step3_sin_arroba.emails.push(`${profile.dni}: ${profile.email} → ${cleanEmail}`);
          }
        }
      }
    }

    // Step 4: Add missing domain extensions
    console.log('Step 4: Adding missing domain extensions...');
    const { data: profilesWithoutDomain } = await supabase
      .from('profiles')
      .select('id, dni, email')
      .is('user_id', null)
      .eq('migrated', true)
      .like('email', '%@%')
      .not('email', 'like', '%@%.%');

    if (profilesWithoutDomain) {
      for (const profile of profilesWithoutDomain) {
        let cleanEmail = profile.email;
        
        if (cleanEmail.endsWith('@gmail')) {
          cleanEmail += '.com';
        } else if (cleanEmail.endsWith('@hotmail')) {
          cleanEmail += '.com';
        } else if (cleanEmail.endsWith('@outlook')) {
          cleanEmail += '.com';
        } else if (cleanEmail.endsWith('@yahoo')) {
          cleanEmail += '.com.ar';
        }
        
        if (cleanEmail !== profile.email) {
          const { error } = await supabase
            .from('profiles')
            .update({ email: cleanEmail })
            .eq('id', profile.id);
          
          if (error) {
            results.errors.push({ step: 4, dni: profile.dni, error: error.message });
          } else {
            results.step4_sin_dominio.count++;
            results.step4_sin_dominio.emails.push(`${profile.dni}: ${profile.email} → ${cleanEmail}`);
          }
        }
      }
    }

    // Count remaining profiles without user_id
    const { count: remainingCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null)
      .eq('migrated', true);

    console.log('Email cleanup completed');
    console.log(`Remaining profiles without user_id: ${remainingCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        remainingProfiles: remainingCount,
        summary: {
          comasCorregidas: results.step1_comas.count,
          espaciosCorregidos: results.step2_espacios.count,
          arrobasAgregadas: results.step3_sin_arroba.count,
          dominiosAgregados: results.step4_sin_dominio.count,
          errores: results.errors.length,
          perfilesPendientes: remainingCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
