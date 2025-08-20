import { DatabaseService } from './databaseService.js';
import { WildberriesApiService } from './wildberriesApi.js';
import { GoogleSheetsService } from './googleSheetsService.js';
import type { WarehouseBoxRates } from '../types/wildberriesApi.js';

export class TariffSyncService {
  private db: DatabaseService;
  private wbApi: WildberriesApiService;
  private googleSheets: GoogleSheetsService;

  constructor() {
    this.db = new DatabaseService();
    this.wbApi = new WildberriesApiService();
    this.googleSheets = new GoogleSheetsService();
  }

  async syncTariffs(effectiveDate?: string): Promise<void> {
    const startTime = Date.now();
    const dateParam: string = (effectiveDate ||
      new Date().toISOString().split('T')[0]) as string;
    console.log(`[Sync] Начало синхронизации тарифов на дату: ${dateParam}`);

    try {
      const apiResponse = await this.wbApi.getBoxTariffs(dateParam);
      const { response } = apiResponse;
      const data = response.data;

      if (!data.warehouseList || data.warehouseList.length === 0) {
        console.warn('[Sync] Нет данных о тарифах в ответе API');
        return;
      }

      const periodId = await this.ensureTariffPeriod(
        data.dtNextBox,
        data.dtTillMax,
      );

      let processedWarehouses = 0;
      let processedTariffs = 0;

      for (const warehouse of data.warehouseList) {
        try {
          const warehouseId = await this.ensureWarehouse(warehouse);

          await this.saveTariff(periodId, warehouseId, warehouse, dateParam);

          processedTariffs++;
        } catch (error) {
          console.error(
            `[Sync] Ошибка обработки склада ${warehouse.warehouseName}:`,
            error,
          );
        }
        processedWarehouses++;
      }

      await this.logSyncResult(
        true,
        processedWarehouses,
        processedTariffs,
        dateParam,
      );

      const duration = Date.now() - startTime;
      console.log(
        `[Sync] Синхронизация завершена за ${duration}ms. Обработано: ${processedTariffs} тарифов на дату ${dateParam}`,
      );

      if (processedTariffs > 0) {
        console.log(
          '[Sync] Запуск обновления Google Sheets после синхронизации тарифов',
        );
        try {
          await this.googleSheets.updateAllSheets();
          console.log('[Sync] Обновление Google Sheets завершено успешно');
        } catch (error) {
          console.error('[Sync] Ошибка обновления Google Sheets:', error);
        }
      }
    } catch (error) {
      console.error('[Sync] Ошибка синхронизации:', error);
      await this.logSyncResult(
        false,
        0,
        0,
        dateParam,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  private async ensureTariffPeriod(
    dtNextBox: string,
    dtTillMax: string,
  ): Promise<number> {
    const knex = this.db.getKnex();

    const existing = await knex('tariff_periods')
      .where({ dt_next_box: dtNextBox, dt_till_max: dtTillMax })
      .first();

    if (existing) {
      return existing.id;
    }

    const [period] = await knex('tariff_periods')
      .insert({
        dt_next_box: dtNextBox,
        dt_till_max: dtTillMax,
      })
      .returning('id');

    console.log(
      `[Sync] Создан новый период тарифов: ${dtNextBox} - ${dtTillMax}`,
    );
    return period.id;
  }

  private async ensureWarehouse(warehouse: WarehouseBoxRates): Promise<number> {
    const knex = this.db.getKnex();

    const existing = await knex('warehouses')
      .where({
        warehouse_name: warehouse.warehouseName,
        geo_name: warehouse.geoName,
      })
      .first();

    if (existing) {
      return existing.id;
    }

    const [warehouseRecord] = await knex('warehouses')
      .insert({
        warehouse_name: warehouse.warehouseName,
        geo_name: warehouse.geoName,
      })
      .returning('id');

    console.log(
      `[Sync] Создан новый склад: ${warehouse.warehouseName} (${warehouse.geoName})`,
    );
    return warehouseRecord.id;
  }

  private async saveTariff(
    periodId: number,
    warehouseId: number,
    warehouse: WarehouseBoxRates,
    effectiveDate: string,
  ): Promise<void> {
    const knex = this.db.getKnex();

    const existing = await knex('box_tariffs')
      .where({
        tariff_period_id: periodId,
        warehouse_id: warehouseId,
        effective_date: effectiveDate,
      })
      .first();

    function parseNumber(value: string) {
      if (!value || value === '-') return 0;
      return Number.parseFloat(value.toString().replace(',', '.'));
    }

    const tariffData = {
      tariff_period_id: periodId,
      warehouse_id: warehouseId,
      effective_date: effectiveDate,
      box_delivery_base: parseNumber(warehouse.boxDeliveryBase),
      box_delivery_liter: parseNumber(warehouse.boxDeliveryLiter),
      box_delivery_coef_expr: parseNumber(warehouse.boxDeliveryCoefExpr),
      box_delivery_marketplace_base: parseNumber(
        warehouse.boxDeliveryMarketplaceBase,
      ),
      box_delivery_marketplace_liter: parseNumber(
        warehouse.boxDeliveryMarketplaceLiter,
      ),
      box_delivery_marketplace_coef_expr: parseNumber(
        warehouse.boxDeliveryMarketplaceCoefExpr,
      ),
      box_storage_base: parseNumber(warehouse.boxStorageBase),
      box_storage_liter: parseNumber(warehouse.boxStorageLiter),
      box_storage_coef_expr: parseNumber(warehouse.boxStorageCoefExpr),
    };

    if (existing) {
      await knex('box_tariffs').where({ id: existing.id }).update(tariffData);
    } else {
      await knex('box_tariffs').insert(tariffData);
    }
  }

  private async logSyncResult(
    success: boolean,
    warehousesProcessed: number,
    tariffsProcessed: number,
    effectiveDate: string,
    errorMessage?: string,
  ): Promise<void> {
    const knex = this.db.getKnex();

    await knex('sync_logs').insert({
      sync_type: 'wb_api_sync',
      status: success ? 'success' : 'error',
      records_processed: tariffsProcessed,
      error_message: errorMessage || null,
      metadata: JSON.stringify({
        warehouses_processed: warehousesProcessed,
        tariffs_processed: tariffsProcessed,
        effective_date: effectiveDate,
      }),
    });
  }
}
