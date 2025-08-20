import type { Knex } from 'knex';

exports.up = async (knex: Knex): Promise<void> =>
  knex.schema.createTable('box_tariffs', (table) => {
    table.increments('id').primary();
    table
      .integer('tariff_period_id')
      .notNullable()
      .references('id')
      .inTable('tariff_periods')
      .onDelete('CASCADE');
    table
      .integer('warehouse_id')
      .notNullable()
      .references('id')
      .inTable('warehouses')
      .onDelete('CASCADE');
    table.decimal('box_delivery_base', 10, 2).notNullable();
    table.decimal('box_delivery_liter', 10, 2).notNullable();
    table.decimal('box_delivery_coef_expr', 5, 2).nullable();
    table.decimal('box_delivery_marketplace_base', 10, 2).notNullable();
    table.decimal('box_delivery_marketplace_liter', 10, 2).notNullable();
    table.decimal('box_delivery_marketplace_coef_expr', 5, 2).nullable();
    table.decimal('box_storage_base', 10, 2).notNullable();
    table.decimal('box_storage_liter', 10, 2).notNullable();
    table.decimal('box_storage_coef_expr', 5, 2).nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['tariff_period_id', 'warehouse_id']);
    table.index('tariff_period_id', 'idx_box_tariffs_period');
    table.index('warehouse_id', 'idx_box_tariffs_warehouse');
    table.index('created_at', 'idx_box_tariffs_created');
  });

exports.down = async (knex: Knex): Promise<void> =>
  knex.schema.dropTable('box_tariffs');
