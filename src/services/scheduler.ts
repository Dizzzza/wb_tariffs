import cron, { type ScheduledTask } from 'node-cron';
import { TariffSyncService } from './tariffSync.js';
import { GoogleSheetsService } from './googleSheetsService.js';

export class SchedulerService {
  private tariffSync: TariffSyncService;
  private googleSheets: GoogleSheetsService;
  private isRunning = false;
  private scheduledTask: ScheduledTask | null = null;
  private sheetsUpdateTask: ScheduledTask | null = null;

  constructor() {
    this.tariffSync = new TariffSyncService();
    this.googleSheets = new GoogleSheetsService();
  }

  start(): void {
    if (this.isRunning) {
      console.warn('[Scheduler] Планировщик уже запущен');
      return;
    }

    const cronExpression = process.env.SYNC_CRON_SCHEDULE || '0 6 * * *';
    const sheetsCronExpression =
      process.env.SHEETS_SYNC_CRON_SCHEDULE || '0 7 * * *';

    console.log(
      `[Scheduler] Запуск планировщика с расписанием: ${cronExpression}`,
    );
    console.log(
      `[Scheduler] Запуск планировщика Google Sheets с расписанием: ${sheetsCronExpression}`,
    );

    this.scheduledTask = cron.schedule(cronExpression, async () => {
      console.log('[Scheduler] Запуск плановой синхронизации тарифов');

      try {
        await this.tariffSync.syncTariffs();
        console.log('[Scheduler] Плановая синхронизация завершена успешно');
      } catch (error) {
        console.error('[Scheduler] Ошибка плановой синхронизации:', error);
      }
    });

    this.sheetsUpdateTask = cron.schedule(sheetsCronExpression, async () => {
      console.log('[Scheduler] Запуск планового обновления Google Sheets');

      try {
        await this.googleSheets.updateSheetsWithDateTables();
        console.log(
          '[Scheduler] Плановое обновление Google Sheets завершено успешно',
        );
      } catch (error) {
        console.error(
          '[Scheduler] Ошибка планового обновления Google Sheets:',
          error,
        );
      }
    });

    this.isRunning = true;
    console.log('[Scheduler] Планировщик запущен');
  }

  stop(): void {
    if (!this.isRunning) {
      console.warn('[Scheduler] Планировщик не запущен');
      return;
    }

    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
    }

    if (this.sheetsUpdateTask) {
      this.sheetsUpdateTask.stop();
      this.sheetsUpdateTask = null;
    }

    this.isRunning = false;
    console.log('[Scheduler] Планировщик остановлен');
  }

  async runManualSync(): Promise<void> {
    console.log('[Scheduler] Запуск ручной синхронизации тарифов');

    try {
      await this.tariffSync.syncTariffs();
      console.log('[Scheduler] Ручная синхронизация завершена успешно');
    } catch (error) {
      console.error('[Scheduler] Ошибка ручной синхронизации:', error);
      throw error;
    }
  }

  async runManualSheetsUpdate(): Promise<void> {
    console.log('[Scheduler] Запуск ручного обновления Google Sheets');

    try {
      await this.googleSheets.updateSheetsWithDateTables();
      console.log(
        '[Scheduler] Ручное обновление Google Sheets завершено успешно',
      );
    } catch (error) {
      console.error(
        '[Scheduler] Ошибка ручного обновления Google Sheets:',
        error,
      );
      throw error;
    }
  }
}
