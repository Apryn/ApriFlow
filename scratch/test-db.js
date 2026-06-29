const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://chpvfwjwghjjrbbhvjqm.supabase.co';
const supabaseKey = 'sb_publishable_Ee91zZeM683ObghOa_n5LQ_AZNhqHK4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log("Querying profiles table...");
  try {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
      console.log("Profiles query error:", pError.message);
    } else {
      console.log("Profiles query SUCCESS. Total rows found:", profiles.length);
    }
  } catch (err) {
    console.error("Profiles exception:", err);
  }

  console.log("\nQuerying categories table...");
  try {
    const { data: categories, error: cError } = await supabase.from('categories').select('*').limit(1);
    if (cError) {
      console.log("Categories query error:", cError.message);
    } else {
      console.log("Categories query SUCCESS. Total rows found:", categories.length);
    }
  } catch (err) {
    console.error("Categories exception:", err);
  }
}

testDatabase();
