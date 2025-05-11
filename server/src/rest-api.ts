import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Import knex instance
import { db } from './db/knex';
// import query from 'pg-query'; // Only if using raw queries

const memoryCache = new Map<string, string>(); // slug → original_url

async function isValidUrl(url: string): Promise<boolean> {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10); // 8-char slug
}

// Root endpoint - Hello world
app.get('/', async (_req, res) => {
  res.json({ hello: 'world', 'client-default-port': 3000 });
});

// Example route (for testing only)
app.get('/examples', async (_req, res) => {
  const docs = await db('example_foreign_table').select('*');
  res.json({ docs });
});

app.post('/examples', async (req, res) => {
  const { authMethod, name } = req.body;
  const [doc] = await db('example_foreign_table')
    .insert({
      authMethod,
      name,
    })
    .returning('*');
  res.json({ doc });
});

// POST /shorten - Creates a shortened URL
app.post('/shorten', async (req, res) => {
  const { original_url, slug, expires_at, utm_params } = req.body;

  if (!original_url || !isValidUrl(original_url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let finalSlug = slug || generateSlug();

  try {
    const exists = await db('shortened_urls').where({ slug: finalSlug }).first();
    if (exists) {
      return res.status(400).json({ error: 'Slug already taken' });
    }

    await db('shortened_urls').insert({
      original_url,
      slug: finalSlug,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      utm_params: utm_params || null
    });

    res.json({ short_url: `http://localhost:8000/${finalSlug}` });
  } catch (err) {
    console.error('Error creating short URL:', err.message);
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});


// GET /:slug - Redirects to original URL
app.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  // ✅ First check in-memory cache
  const cached = memoryCache.get(slug);
  if (cached) {
    return res.redirect(cached);
  }

  // ❌ Fallback to DB
  const result = await db('shortened_urls')
    .select('original_url', 'utm_params')
    .whereRaw("slug = ? AND (expires_at IS NULL OR expires_at > NOW())", [slug])
    .first();

  if (!result) {
    return res.status(404).send('Not found or expired');
  }

  // 🚀 Update cache
  memoryCache.set(slug, result.original_url);

  // 📈 Increment redirect count
  await db('shortened_urls').where({ slug }).increment('redirect_count', 1);
  let redirectUrl = result.original_url;

      if (result.utm_params) {
        const utmString = new URLSearchParams(result.utm_params).toString();
        const separator = redirectUrl.includes('?') ? '&' : '?';
        redirectUrl += `${separator}${utmString}`;
      }
  // 🔄 Redirect
  res.redirect(result.original_url);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});