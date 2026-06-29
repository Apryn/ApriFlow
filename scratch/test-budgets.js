const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://chpvfwjwghjjrbbhvjqm.supabase.co';
const supabaseKey = 'sb_publishable_Ee91zZeM683ObghOa_n5LQ_AZNhqHK4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBudgetsTable() {
  console.log("Querying budgets table...");
  try {
    const { data, error } = await supabase.from('budgets').select('*').limit(1);
    if (error) {
      console.log("Error querying budgets:", error);
    } else {
      console.log("SUCCESS! Budgets table exists. Found rows:", data.length);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

testBudgetsTable();
