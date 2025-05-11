import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Import knex instance
import { db } from "./db/knex";

/*
##################################################
||                                              ||
||              Example endpoints               ||
||                                              ||
##################################################
*/

// Root endpoint - Returns a simple hello world message and default client port
app.get("/", async (_req, res) => {
  res.json({ hello: "world", "client-default-port": 3000 });
});

// Example existing route
app.get("/examples", async (_req, res) => {
  const docs = await db("example_foreign_table").select("*");
  res.json({ docs });
});

app.post("/examples", async (req, res) => {
  const { authMethod, name } = req.body;
  const [doc] = await db("example_foreign_table")
    .insert({
      authMethod,
      name,
    })
    .returning("*");
  res.json({ doc });
});

/*
##################################################
||                                              ||
||              URL Shortener Routes            ||
||                                              ||
##################################################
*/

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

// POST /shorten - Creates a shortened URL
app.post("/shorten", async (req, res) => {
  const { original_url, slug } = req.body;

  if (!original_url || !isValidUrl(original_url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  let finalSlug = slug || generateSlug();

  try {
    const exists = await db("shortened_urls").where({ slug: finalSlug }).first();

    if (exists) {
      return res.status(400).json({ error: "Slug already taken" });
    }

    await db("shortened_urls").insert({
      original_url,
      slug: finalSlug,
    });

    res.json({ short_url: `https://symph.co/${finalSlug}` });
  } catch (err) {
    console.error("Error creating short URL:", err.message);
    res.status(500).json({ error: "Failed to shorten URL" });
  }
});

// GET /:slug - Redirects to original URL
app.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await db("shortened_urls").where({ slug }).first();

    if (!result) {
      return res.status(404).send("Not found");
    }

    await db("shortened_urls")
      .where({ slug })
      .increment("redirect_count", 1);

    res.redirect(result.original_url);
  } catch (err) {
    console.error("Redirect error:", err.message);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server has started on port ${PORT}`);
});