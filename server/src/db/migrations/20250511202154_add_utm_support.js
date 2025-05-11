const { Knex } = require('knex');

exports.up = async function(knex) {
  const hasUtmParams = await knex.schema.hasColumn('shortened_urls', 'utm_params');

  if (!hasUtmParams) {
    await knex.schema.alterTable('shortened_urls', (table) => {
      table.jsonb('utm_params').nullable().defaultTo(null);
    });
  }
};

exports.down = async function(knex) {
  const hasUtmParams = await knex.schema.hasColumn('shortened_urls', 'utm_params');

  if (hasUtmParams) {
    await knex.schema.alterTable('shortened_urls', (table) => {
      table.dropColumn('utm_params');
    });
  }
};
