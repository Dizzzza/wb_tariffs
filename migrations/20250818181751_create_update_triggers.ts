import type { Knex } from "knex"

exports.up = async (knex: Knex): Promise<void> => {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `)
  const tables = ["tariff_periods", "warehouses", "box_tariffs", "google_sheets_config"]
  for (const table of tables) {
    await knex.raw(`
      CREATE TRIGGER update_${table}_updated_at 
      BEFORE UPDATE ON ${table} 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `)
  }
}

exports.down = async (knex: Knex): Promise<void> => {
  const tables = ["tariff_periods", "warehouses", "box_tariffs", "google_sheets_config"]

  for (const table of tables) {
    await knex.raw(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};`)
  }

  await knex.raw("DROP FUNCTION IF EXISTS update_updated_at_column();")
}
