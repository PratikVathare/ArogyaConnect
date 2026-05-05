const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('appointments').select('*').limit(1);
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Columns:", Object.keys(data[0] || {}));
  }
}

check();
