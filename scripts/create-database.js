const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Подключается к базе postgres по умолчанию
  });

  try {
    await client.connect();

    // Проверяет существует ли база
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.DB_NAME],
    );

    if (result.rows.length === 0) {
      // Создает базу если ее нет
      await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`Database ${process.env.DB_NAME} created successfully`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
