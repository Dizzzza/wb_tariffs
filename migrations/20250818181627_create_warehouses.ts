import type { Knex } from "knex"

exports.up = async (knex: Knex): Promise<void> =>
  knex.schema.createTable("warehouses", (table) => {
    table.increments("id").primary()
    table.string("warehouse_name", 255).notNullable()
    table.string("geo_name", 255).notNullable()
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now())
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now())

    table.unique(["warehouse_name", "geo_name"])
    table.index("warehouse_name", "idx_warehouses_name")
  })

exports.down = async (knex: Knex): Promise<void> => knex.schema.dropTable("warehouses")
