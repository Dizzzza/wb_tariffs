import type { Knex } from "knex"

exports.up = async (knex: Knex): Promise<void> =>
  knex.schema.createTable("tariff_periods", (table) => {
    table.increments("id").primary()
    table.date("dt_next_box").notNullable()
    table.date("dt_till_max").notNullable()
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now())
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now())

    table.unique(["dt_next_box", "dt_till_max"])
  })

exports.down = async (knex: Knex): Promise<void> => knex.schema.dropTable("tariff_periods")
