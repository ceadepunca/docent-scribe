import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or key not found. Make sure to have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  try {
    // First, get the school ID for 'ENET nro 1'
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('name', 'ENET nro 1')
      .single();

    if (schoolError || !schoolData) {
      console.error('Error fetching school:', schoolError?.message || 'ENET nro 1 not found');
      return;
    }

    const enetSchoolId = schoolData.id;

    // Now, check if the position exists for that school
    const { data, error } = await supabase
      .from('administrative_positions')
      .select('name')
      .eq('name', 'BIBLIOTECARIO')
      .eq('school_id', enetSchoolId);

    if (error) {
      console.error('Error fetching administrative positions:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Verification successful: "BIBLIOTECARIO" position exists for ENET nro 1.');
    } else {
      console.log('Verification failed: "BIBLIOTECARIO" position does not exist for ENET nro 1.');
    }
  } catch (e) {
    console.error('An unexpected error occurred:', e.message);
  }
}

verify();
