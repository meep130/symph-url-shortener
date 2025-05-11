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
import query from 'pg-query'; // Only if using raw queries

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
  const { original_url, slug } = req.body;

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
    });

    res.json({ short_url: `https://symph.co/${finalSlug}` }); // ✅ Removed extra 
    // res.json({ short_url: `http://localhost:8000/${finalSlug}` });
  } catch (err) {
    console.error('Error creating short URL:', err.message);
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});

// GET /:slug - Redirects to original URL
app.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await db('shortened_urls')
      .whereRaw("slug = ? AND (expires_at IS NULL OR expires_at > NOW())", [slug])
      .first();

    if (!result) {
      return res.status(404).send('Not found or link expired');
    }

    // Increment redirect count
    await db('shortened_urls')
      .where({ slug })
      .increment('redirect_count', 1);

    // Redirect user
    res.redirect(result.original_url);
  } catch (err) {
    console.error('Redirect failed:', err.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});