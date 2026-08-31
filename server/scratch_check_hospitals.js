const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Fetching hospitals...");
  const { data, error } = await supabase.from('hospitals').select('*');
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Found", data.length, "hospitals:");
    console.log(data);
    if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0] || {}));
    }
  }
}

check();
