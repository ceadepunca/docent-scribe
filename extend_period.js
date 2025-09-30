import { createClient } from './src/integrations/supabase/client.ts';

const supabase = createClient();

async function extendPeriod() {
  try {
    console.log('🔍 Checking existing periods...');
    
    // First, let's see what periods exist
    const { data: existingPeriods, error: selectError } = await supabase
      .from('inscription_periods')
      .select('id, name, start_date, end_date, is_active, available_levels')
      .or('name.ilike.%SECUNDARIO%,name.ilike.%2025%')
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('Error fetching periods:', selectError);
      return;
    }

    console.log('📋 Existing periods:');
    existingPeriods?.forEach(period => {
      console.log(`- ${period.name} (${period.id})`);
      console.log(`  Start: ${period.start_date}`);
      console.log(`  End: ${period.end_date}`);
      console.log(`  Active: ${period.is_active}`);
      console.log(`  Levels: ${period.available_levels?.join(', ')}`);
      console.log('');
    });

    // Update periods that match our criteria
    const newEndDate = '2025-12-31T23:59:59+00:00';
    
    console.log('🔄 Updating periods...');
    
    // Update "SECUNDARIO ORDINARIA 2025"
    const { data: update1, error: error1 } = await supabase
      .from('inscription_periods')
      .update({ 
        end_date: newEndDate,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'SECUNDARIO ORDINARIA 2025')
      .select();

    if (error1) {
      console.error('Error updating SECUNDARIO ORDINARIA 2025:', error1);
    } else if (update1 && update1.length > 0) {
      console.log('✅ Updated SECUNDARIO ORDINARIA 2025');
    }

    // Update "INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO"
    const { data: update2, error: error2 } = await supabase
      .from('inscription_periods')
      .update({ 
        end_date: newEndDate,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO')
      .select();

    if (error2) {
      console.error('Error updating INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO:', error2);
    } else if (update2 && update2.length > 0) {
      console.log('✅ Updated INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO');
    }

    // Update any period that contains "SECUNDARIO" and "2025" and is active
    const { data: update3, error: error3 } = await supabase
      .from('inscription_periods')
      .update({ 
        end_date: newEndDate,
        updated_at: new Date().toISOString()
      })
      .ilike('name', '%SECUNDARIO%')
      .ilike('name', '%2025%')
      .eq('is_active', true)
      .lt('end_date', newEndDate)
      .select();

    if (error3) {
      console.error('Error updating other SECUNDARIO 2025 periods:', error3);
    } else if (update3 && update3.length > 0) {
      console.log(`✅ Updated ${update3.length} other SECUNDARIO 2025 periods`);
    }

    // Ensure periods are active
    const { data: update4, error: error4 } = await supabase
      .from('inscription_periods')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .ilike('name', '%SECUNDARIO%')
      .ilike('name', '%2025%')
      .gte('end_date', newEndDate)
      .select();

    if (error4) {
      console.error('Error activating periods:', error4);
    } else if (update4 && update4.length > 0) {
      console.log(`✅ Activated ${update4.length} periods`);
    }

    console.log('🔍 Final periods after update:');
    
    // Show updated periods
    const { data: finalPeriods, error: finalError } = await supabase
      .from('inscription_periods')
      .select('id, name, start_date, end_date, is_active, available_levels')
      .or('name.ilike.%SECUNDARIO%,name.ilike.%2025%')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('Error fetching final periods:', finalError);
      return;
    }

    finalPeriods?.forEach(period => {
      console.log(`- ${period.name} (${period.id})`);
      console.log(`  Start: ${period.start_date}`);
      console.log(`  End: ${period.end_date}`);
      console.log(`  Active: ${period.is_active}`);
      console.log(`  Levels: ${period.available_levels?.join(', ')}`);
      console.log('');
    });

    console.log('🎉 Period extension completed successfully!');

  } catch (error) {
    console.error('❌ Error extending period:', error);
  }
}

extendPeriod();
