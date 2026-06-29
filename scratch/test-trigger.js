const { createClient } = require('@supabase/supabase-js');

// Using the same credentials
const supabaseUrl = 'https://chpvfwjwghjjrbbhvjqm.supabase.co';
// We need the service role key to write to profiles or categories without RLS constraints (or test RLS)
// Let's check if we have the service role key. If not, we will use the anon key.
const supabaseKey = 'sb_publishable_Ee91zZeM683ObghOa_n5LQ_AZNhqHK4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTriggerStepByStep() {
  const dummyUserId = '11111111-1111-1111-1111-111111111111';
  
  console.log("1. Attempting to insert a dummy profile...");
  try {
    const { data, error } = await supabase.from('profiles').insert({
      id: dummyUserId,
      display_name: 'Test Trigger User'
    }).select();
    
    if (error) {
      console.log("Error inserting profile:", error);
      return;
    }
    console.log("Profile inserted successfully!");
  } catch (err) {
    console.error("Profile exception:", err);
    return;
  }

  console.log("\n2. Attempting to call seed_default_categories function...");
  try {
    // We can run RPC if the function is exposed, or we can just try to insert a category manually
    const { data, error } = await supabase.rpc('seed_default_categories', { p_user_id: dummyUserId });
    if (error) {
      console.log("RPC seed_default_categories error:", error);
    } else {
      console.log("RPC seed_default_categories SUCCESS:", data);
    }
  } catch (err) {
    console.error("RPC exception:", err);
  }
  
  // Clean up
  console.log("\n3. Cleaning up...");
  await supabase.from('profiles').delete().eq('id', dummyUserId);
}

testTriggerStepByStep();
