import type { Knex } from "knex"

exports.up = async (knex: Knex): Promise<void> =>
  knex.schema.createTable("sync_logs", (table) => {
    table.increments("id").primary()
    table.integer("sheet_config_id").references("id").inTable("google_sheets_config").onDelete("CASCADE")
    table.string("sync_type", 50).notNullable()
    table.string("status", 20).notNullable()
    table.integer("records_processed").defaultTo(0)
    table.text("error_message").nullable()
    table.jsonb("metadata").nullable() // <- добавлено
    table.timestamp("started_at", { useTz: true }).defaultTo(knex.fn.now())
    table.timestamp("completed_at", { useTz: true }).nullable()

    table.index(["sheet_config_id", "sync_type"], "idx_sync_logs_sheet_type")
    table.index("status", "idx_sync_logs_status")
    table.index("started_at", "idx_sync_logs_started")
  })

exports.down = async (knex: Knex): Promise<void> => knex.schema.dropTable("sync_logs")
