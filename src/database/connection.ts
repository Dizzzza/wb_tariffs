import dotenv from "dotenv"
dotenv.config()

import knex, { type Knex } from "knex"
import config from "../../knexfile"

const environment = process.env.NODE_ENV || "development"
const knexConfig = config[environment as keyof typeof config]

if (!knexConfig) {
  throw new Error(`Конфигурация для окружения "${environment}" не найдена`)
}

let db: Knex | null = null

export const getDatabase = (): Knex => {
  if (!db) {
    db = knex(knexConfig)
  }
  return db
}

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.destroy()
    db = null
  }
}

export default getDatabase
