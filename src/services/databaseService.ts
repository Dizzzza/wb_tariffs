import type { Knex } from 'knex';
import getDatabase from '../database/connection';

export class DatabaseService {
  private db: Knex;

  constructor() {
    this.db = getDatabase();
  }

  async connect(): Promise<void> {
    const isConnected = await this.checkConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
  }

  async disconnect(): Promise<void> {
    await this.close();
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('[v0] Starting database migrations...');
      await this.db.migrate.latest();
      console.log('[v0] Database migrations completed successfully');
    } catch (error) {
      console.error('[v0] Migration error:', error);
      throw new Error(`Migration failed: ${error}`);
    }
  }

  async rollbackMigration(): Promise<void> {
    try {
      console.log('[v0] Rolling back last migration...');
      await this.db.migrate.rollback();
      console.log('[v0] Migration rollback completed');
    } catch (error) {
      console.error('[v0] Rollback error:', error);
      throw new Error(`Rollback failed: ${error}`);
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.db.raw('SELECT 1');
      console.log('[v0] Database connection successful');
      return true;
    } catch (error) {
      console.error('[v0] Database connection failed:', error);
      return false;
    }
  }

  async getMigrationStatus(): Promise<{
    completed: string[];
    pending: string[];
  }> {
    try {
      const [completed, pending] = await this.db.migrate.list();

      return {
        completed: completed,
        pending: pending,
      };
    } catch (error) {
      console.error('[v0] Error getting migration status:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.db.destroy();
      console.log('[v0] Database connection closed');
    } catch (error) {
      console.error('[v0] Error closing database connection:', error);
      throw error;
    }
  }

  getKnex(): Knex {
    return this.db;
  }
}

export default DatabaseService;
