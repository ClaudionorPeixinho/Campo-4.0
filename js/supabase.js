const supabaseUrl = "https://szzfqkhibuejhodhkvjj.supabase.co";
const supabaseKey = "sb_publishable_hIEhtwoXoQKvu2SkQYr4Tg_7HuC1-G_";

// cria cliente corretamente
window.supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);