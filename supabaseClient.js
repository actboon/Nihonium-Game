// Supabaseクライアント初期化（自分のURLとanonキーを必ず入力してください）
// 例: https://xxxx.supabase.co, public-anon-key
const SUPABASE_URL = 'https://pxakloyzqgfwxsxbbsnl.supabase.co'; // ←ここを自分のURLに
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YWtsb3l6cWdmd3hzeGJic25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTEwOTksImV4cCI6MjA2NDc4NzA5OX0.LbQ7XtkwngrrbLcl1o0u38yLhpHL-kx8gM9diNCO_7U'; // ←ここを自分のキーに

// CDNでsupabase-jsを読み込む必要あり
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// スコア送信
async function submitScore(username, score) {
  const { data, error } = await supabase.from('scores').insert([
    { username, score }
  ]);
  return { data, error };
}

// ランキング取得（上位10件）
async function fetchRanking() {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);
  return { data, error };
}
