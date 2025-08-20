import type { Knex } from 'knex';

exports.up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('box_tariffs', (table) => {
    table.date('effective_date').notNullable().defaultTo(knex.fn.now());
    table.index('effective_date', 'idx_box_tariffs_effective_date');

    table.dropUnique(['tariff_period_id', 'warehouse_id']);
    table.unique(['tariff_period_id', 'warehouse_id', 'effective_date']);
  });
};

exports.down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('box_tariffs', (table) => {
    table.dropIndex('effective_date', 'idx_box_tariffs_effective_date');
    table.dropUnique(['tariff_period_id', 'warehouse_id', 'effective_date']);
    table.dropColumn('effective_date');
    table.unique(['tariff_period_id', 'warehouse_id']);
  });
};
