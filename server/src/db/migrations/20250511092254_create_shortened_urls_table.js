const { Knex } = require('knex');

/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await knex.schema.createTable('shortened_urls', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('original_url').notNullable();
    table.string('slug').unique().notNullable();
  });
};

exports.redirectUrl = async function (req, res) {
  const { slug } = req.params;

  try {
    const result = await query('SELECT original_url FROM shortened_urls WHERE slug = $1 AND (expires_at IS NULL OR expires_at > NOW())', [slug]);

    if (result.rows.length === 0) {
      return res.status(404).send('Not found or expired');
    }

    await query('UPDATE shortened_urls SET redirect_count = redirect_count + 1 WHERE slug = $1', [slug]);
    res.redirect(result.rows[0].original_url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTable('shortened_urls');
};