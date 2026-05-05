const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("Testing connection to Supabase...");
  const { data, error } = await supabase.from('hospitals').select('*').limit(1);
  if (error) {
    console.log("ERROR: Connection failed.", error.message);
  } else {
    console.log("SUCCESS! Connected and fetched rows:", data.length);
  }
}

testConnection();
