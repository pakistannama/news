// =====================
// Supabase Connection
// =====================
function initSupabase() {
  if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
    return null;
  }
  return window.supabase.createClient(
    'https://eeyzlmnizlxejgbbalcl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVleXpsbW5pemx4ZWpnYmJhbGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjU3NTQsImV4cCI6MjA5MjgwMTc1NH0.m3IGcrkWMZSb9xmu1yqPCzbltAakQ2RNQgyi9GzcNyo'
  );
}

window._db = null;
function getDb() {
  if (!window._db) window._db = initSupabase();
  return window._db;
}

// =====================
// News load karo
// =====================
async function getNews(limit = 20, catId = null) {
  const db = getDb();
  if (!db) return [];
  let query = db
    .from('news')
    .select('*, categories(name, slug, color, icon), authors(name)')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (catId) query = query.eq('cat_id', catId);
  const { data, error } = await query;
  if (error) console.error('getNews error:', error);
  return data || [];
}

// =====================
// Single news by slug
// =====================
async function getNewsBySlug(slug) {
  const db = getDb();
  if (!db) return null;

  // URL decode karo — Urdu slugs encode hote hain
  let decoded;
  try { decoded = decodeURIComponent(slug); } catch(e) { decoded = slug; }

  // Pehle decoded slug se try karo
  const { data } = await db
    .from('news')
    .select('*, categories(name, slug, color, icon), authors(name)')
    .eq('slug', decoded)
    .maybeSingle();
  if (data) return data;

  // Agar nahi mila to original slug se try karo
  const { data: data2 } = await db
    .from('news')
    .select('*, categories(name, slug, color, icon), authors(name)')
    .eq('slug', slug)
    .maybeSingle();
  if (data2) return data2;

  // Last try — id se dhundho agar slug number hai
  if (!isNaN(slug)) {
    const { data: data3 } = await db
      .from('news')
      .select('*, categories(name, slug, color, icon), authors(name)')
      .eq('id', Number(slug))
      .maybeSingle();
    return data3;
  }

  return null;
}

// =====================
// Featured news
// =====================
async function getFeaturedNews() {
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('news')
    .select('*, categories(name, slug, color, icon)')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(5);
  if (error) console.error('getFeaturedNews error:', error);
  return data || [];
}

// =====================
// Categories
// =====================
async function getCategories() {
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('categories')
    .select('*')
    .order('id');
  if (error) console.error('getCategories error:', error);
  return data || [];
}

// =====================
// Breaking news
// =====================
async function getBreakingNews() {
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('breaking_news')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) console.error('getBreakingNews error:', error);
  return data || [];
}

// =====================
// Settings
// =====================
async function getSettings() {
  const db = getDb();
  if (!db) return {};
  const { data, error } = await db
    .from('settings')
    .select('*');
  if (error) console.error('getSettings error:', error);
  const settings = {};
  (data || []).forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

// =====================
// Views update
// =====================
async function incrementViews(id) {
  const db = getDb();
  if (!db) return;
  await db.rpc('increment_views', { news_id: id });
}

// =====================
// Date format Urdu
// =====================
function formatDateUrdu(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('ur-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// =====================
// Slug banao
// =====================
function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .slice(0, 60) + '-' + Date.now();
}
