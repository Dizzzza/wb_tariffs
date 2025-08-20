import { DatabaseService } from './services/databaseService.js';
import { SchedulerService } from './services/scheduler.js';

export class App {
  private db: DatabaseService;
  private scheduler: SchedulerService;

  constructor() {
    this.db = new DatabaseService();
    this.scheduler = new SchedulerService();
  }

  async start(): Promise<void> {
    console.log('[App] Запуск приложения WB Tariffs Service');

    try {
      await this.db.connect();
      console.log('[App] Подключение к базе данных установлено');

      await this.db.runMigrations();
      console.log('[App] Миграции выполнены');

      this.scheduler.start();

      console.log('[App] Запуск первоначальной синхронизации');
      await this.scheduler.runManualSync();

      console.log('[App] Приложение успешно запущено');
    } catch (error) {
      console.error('[App] Ошибка запуска приложения:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('[App] Остановка приложения');

    try {
      this.scheduler.stop();
      await this.db.disconnect();
      console.log('[App] Приложение остановлено');
    } catch (error) {
      console.error('[App] Ошибка остановки приложения:', error);
    }
  }
}
