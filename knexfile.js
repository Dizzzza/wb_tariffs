// knexfile.js
require("dotenv").config() // Загружаем .env

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

const config = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "5432", 10),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "wb_tariffs",
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
      loadExtensions: [".ts"],
      stub: "./migration-stub.ts",
    },
    seeds: {
      directory: "./seeds",
      extension: "ts",
      loadExtensions: [".ts"],
    },
  },

  production: {
    client: "postgresql",
    connection: {
      host: requireEnv("DB_HOST"),
      port: Number.parseInt(requireEnv("DB_PORT"), 10),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
      database: requireEnv("DB_NAME"),
      ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
      loadExtensions: [".ts"],
      stub: "./migration-stub.ts",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
}

require("ts-node").register({
  compilerOptions: {
    module: "commonjs",
    target: "es2020",
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: false,
  },
  transpileOnly: true,
})

module.exports = config
