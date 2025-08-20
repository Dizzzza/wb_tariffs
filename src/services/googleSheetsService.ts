import { google, type sheets_v4 } from 'googleapis';
import { DatabaseService } from './databaseService.js';
import type { GoogleSheetsConfig, BoxTariff } from '../types/database.js';

export class GoogleSheetsService {
  private db: DatabaseService;
  private sheets: sheets_v4.Sheets;

  constructor() {
    this.db = new DatabaseService();

    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
    if (!keyFile) {
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_KEY_FILE environment variable is required',
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async updateAllSheets(): Promise<void> {
    console.log(
      '[Google Sheets] Начало обновления всех таблиц с разделением по датам',
    );

    await this.updateSheetsWithDateTables();
  }

  async updateSheet(sheetConfig: GoogleSheetsConfig): Promise<void> {
    const startTime = Date.now();
    console.log(
      `[Google Sheets] Обновление таблицы: ${sheetConfig.sheet_name} (ID: ${sheetConfig.sheet_id})`,
    );

    try {
      const tariffData = await this.getTariffDataForSheet();

      if (tariffData.length === 0) {
        console.warn(
          `[Google Sheets] Нет данных для обновления таблицы ${sheetConfig.sheet_name}`,
        );
        return;
      }

      const sheetData = this.prepareSheetData(tariffData);

      await this.clearSheet(sheetConfig.sheet_id, 'stocks_coefs');

      await this.writeToSheet(sheetConfig.sheet_id, 'stocks_coefs', sheetData);

      const knex = this.db.getKnex();
      await knex('google_sheets_config')
        .where('id', sheetConfig.id)
        .update({ last_updated: knex.fn.now() });

      await this.logSyncResult(sheetConfig.id, true, tariffData.length);

      const duration = Date.now() - startTime;
      console.log(
        `[Google Sheets] Таблица ${sheetConfig.sheet_name} обновлена за ${duration}ms. Записано: ${tariffData.length} записей`,
      );
    } catch (error) {
      console.error(
        `[Google Sheets] Ошибка обновления таблицы ${sheetConfig.sheet_name}:`,
        error,
      );
      await this.logSyncResult(
        sheetConfig.id,
        false,
        0,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  private async getTariffDataForSheet(
    effectiveDate?: string,
  ): Promise<Array<BoxTariff & { warehouse_name: string; geo_name: string }>> {
    const knex = this.db.getKnex();

    let targetDate = effectiveDate;
    if (!targetDate) {
      const latestDateResult = await knex('box_tariffs')
        .max('effective_date as max_date')
        .first();

      if (!latestDateResult?.max_date) {
        return [];
      }
      targetDate = latestDateResult.max_date;
    }

    const tariffs = await knex('box_tariffs')
      .join('warehouses', 'box_tariffs.warehouse_id', 'warehouses.id')
      .where('box_tariffs.effective_date', targetDate)
      .select(
        'box_tariffs.*',
        'warehouses.warehouse_name',
        'warehouses.geo_name',
      )
      .orderBy('box_tariffs.box_delivery_coef_expr', 'asc');

    return tariffs;
  }

  async getAvailableDates(): Promise<string[]> {
    const knex = this.db.getKnex();

    const dates = await knex('box_tariffs')
      .distinct('effective_date')
      .orderBy('effective_date', 'desc')
      .pluck('effective_date');

    return dates;
  }

  async updateSheetsWithDateTables(): Promise<void> {
    console.log(
      '[Google Sheets] Начало обновления таблиц с разделением по датам',
    );

    const knex = this.db.getKnex();
    const activeSheets = await knex('google_sheets_config')
      .where('is_active', true)
      .select('*');

    if (activeSheets.length === 0) {
      console.log('[Google Sheets] Нет активных таблиц для обновления');
      return;
    }

    const availableDates = await this.getAvailableDates();

    for (const sheetConfig of activeSheets) {
      try {
        await this.updateSheetWithDateTables(sheetConfig, availableDates);
        console.log(
          `[Google Sheets] Таблица ${sheetConfig.sheet_name} обновлена с разделением по датам`,
        );
      } catch (error) {
        console.error(
          `[Google Sheets] Ошибка обновления таблицы ${sheetConfig.sheet_name}:`,
          error,
        );
        await this.logSyncResult(
          sheetConfig.id,
          false,
          0,
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  }

  private async updateSheetWithDateTables(
    sheetConfig: GoogleSheetsConfig,
    dates: string[],
  ): Promise<void> {
    const startTime = Date.now();
    console.log(
      `[Google Sheets] Обновление таблицы с датами: ${sheetConfig.sheet_name}`,
    );

    try {
      await this.clearSheet(sheetConfig.sheet_id, 'stocks_coefs');

      let currentRow = 1;
      let totalRecords = 0;

      for (const date of dates) {
        const tariffData = await this.getTariffDataForSheet(date);

        if (tariffData.length === 0) continue;

        const dateHeader = [[`Тарифы на ${date}`]];
        await this.writeToSheetRange(
          sheetConfig.sheet_id,
          'stocks_coefs',
          `A${currentRow}`,
          dateHeader,
        );
        currentRow += 2;

        const sheetData = this.prepareSheetData(tariffData);
        await this.writeToSheetRange(
          sheetConfig.sheet_id,
          'stocks_coefs',
          `A${currentRow}`,
          sheetData,
        );

        currentRow += sheetData.length + 2;
        totalRecords += tariffData.length;
      }

      const knex = this.db.getKnex();
      await knex('google_sheets_config')
        .where('id', sheetConfig.id)
        .update({ last_updated: knex.fn.now() });

      await this.logSyncResult(sheetConfig.id, true, totalRecords);

      const duration = Date.now() - startTime;
      console.log(
        `[Google Sheets] Таблица ${sheetConfig.sheet_name} обновлена за ${duration}ms. Записано: ${totalRecords} записей по ${dates.length} датам`,
      );
    } catch (error) {
      console.error(
        `[Google Sheets] Ошибка обновления таблицы ${sheetConfig.sheet_name}:`,
        error,
      );
      await this.logSyncResult(
        sheetConfig.id,
        false,
        0,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  private async writeToSheetRange(
    spreadsheetId: string,
    sheetName: string,
    range: string,
    data: string[][],
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });
    } catch (error) {
      console.error(
        `[Google Sheets] Ошибка записи данных в диапазон ${range}:`,
        error,
      );
      throw error;
    }
  }

  private prepareSheetData(
    tariffs: Array<BoxTariff & { warehouse_name: string; geo_name: string }>,
  ): string[][] {
    const headers = [
      'Склад',
      'Регион',
      'Базовая стоимость доставки',
      'Стоимость за литр доставки',
      'Коэффициент доставки',
      'Базовая стоимость доставки (маркетплейс)',
      'Стоимость за литр доставки (маркетплейс)',
      'Коэффициент доставки (маркетплейс)',
      'Базовая стоимость хранения',
      'Стоимость за литр хранения',
      'Коэффициент хранения',
    ];

    const rows = tariffs.map((tariff) => [
      tariff.warehouse_name,
      tariff.geo_name,
      tariff.box_delivery_base.toString(),
      tariff.box_delivery_liter.toString(),
      (tariff.box_delivery_coef_expr || 0).toString(),
      tariff.box_delivery_marketplace_base.toString(),
      tariff.box_delivery_marketplace_liter.toString(),
      (tariff.box_delivery_marketplace_coef_expr || 0).toString(),
      tariff.box_storage_base.toString(),
      tariff.box_storage_liter.toString(),
      (tariff.box_storage_coef_expr || 0).toString(),
    ]);

    return [headers, ...rows];
  }

  private async clearSheet(
    spreadsheetId: string,
    sheetName: string,
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
      });
    } catch (error) {
      console.error(
        `[Google Sheets] Ошибка очистки листа ${sheetName}:`,
        error,
      );
      throw error;
    }
  }

  private async writeToSheet(
    spreadsheetId: string,
    sheetName: string,
    data: string[][],
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });
    } catch (error) {
      console.error(
        `[Google Sheets] Ошибка записи данных в лист ${sheetName}:`,
        error,
      );
      throw error;
    }
  }

  async addSheetConfig(
    sheetId: string,
    sheetName: string,
    description?: string,
  ): Promise<number> {
    const knex = this.db.getKnex();

    const [config] = await knex('google_sheets_config')
      .insert({
        sheet_id: sheetId,
        sheet_name: sheetName,
        description: description || null,
        is_active: true,
      })
      .returning('id');

    console.log(
      `[Google Sheets] Добавлена новая конфигурация таблицы: ${sheetName} (ID: ${sheetId})`,
    );
    return config.id;
  }

  async deactivateSheetConfig(sheetId: string): Promise<void> {
    const knex = this.db.getKnex();

    await knex('google_sheets_config')
      .where('sheet_id', sheetId)
      .update({ is_active: false });

    console.log(
      `[Google Sheets] Деактивирована конфигурация таблицы: ${sheetId}`,
    );
  }

  private async logSyncResult(
    sheetConfigId: number,
    success: boolean,
    recordsProcessed: number,
    errorMessage?: string,
  ): Promise<void> {
    const knex = this.db.getKnex();

    await knex('sync_logs').insert({
      sheet_config_id: sheetConfigId,
      sync_type: 'sheets_update',
      status: success ? 'success' : 'error',
      records_processed: recordsProcessed,
      error_message: errorMessage || null,
      metadata: JSON.stringify({
        records_processed: recordsProcessed,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const knex = this.db.getKnex();
      const testSheet = await knex('google_sheets_config')
        .where('is_active', true)
        .first();

      if (!testSheet) {
        console.warn(
          '[Google Sheets] Нет активных таблиц для проверки подключения',
        );
        return true;
      }

      await this.sheets.spreadsheets.get({
        spreadsheetId: testSheet.sheet_id,
      });

      return true;
    } catch (error) {
      console.error('[Google Sheets] Health check failed:', error);
      return false;
    }
  }
}
