import type { Knex } from "knex"

exports.up = async (knex: Knex): Promise<void> =>
  knex.schema.createTable("google_sheets_config", (table) => {
    table.increments("id").primary()
    table.string("sheet_id", 255).notNullable().unique()
    table.string("sheet_name", 255).notNullable()
    table.text("description").nullable()
    table.boolean("is_active").defaultTo(true)
    table.timestamp("last_updated", { useTz: true }).nullable()
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now())
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now())
  })

exports.down = async (knex: Knex): Promise<void> => knex.schema.dropTable("google_sheets_config")
