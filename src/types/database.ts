export interface TariffPeriod {
  id: number;
  dt_next_box: string;
  dt_till_max: string;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  warehouse_name: string;
  geo_name: string;
  created_at: string;
  updated_at: string;
}

export interface BoxTariff {
  id: number;
  tariff_period_id: number;
  warehouse_id: number;
  effective_date: string;
  box_delivery_base: number;
  box_delivery_liter: number;
  box_delivery_coef_expr?: number;
  box_delivery_marketplace_base: number;
  box_delivery_marketplace_liter: number;
  box_delivery_marketplace_coef_expr?: number;
  box_storage_base: number;
  box_storage_liter: number;
  box_storage_coef_expr?: number;
  created_at: string;
  updated_at: string;
}

export interface GoogleSheetsConfig {
  id: number;
  sheet_id: string;
  sheet_name: string;
  description?: string;
  is_active: boolean;
  last_updated?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: number;
  sheet_config_id?: number;
  sync_type: 'api_fetch' | 'sheets_update' | 'wb_api_sync';
  status: 'success' | 'error' | 'in_progress';
  records_processed: number;
  error_message?: string;
  metadata?: string;
  started_at: string;
  completed_at?: string;
}

export interface WildberriesApiResponse {
  data: {
    dtNextBox: string;
    dtTillMax: string;
    warehouseList: WarehouseBoxRates[] | null;
  };
}

export interface WarehouseBoxRates {
  boxDeliveryAndStorageExpr: string;
  boxDeliveryBase: string;
  boxDeliveryCoefExpr: string;
  boxDeliveryLiter: string;
  boxDeliveryMarketplaceBase: string;
  boxDeliveryMarketplaceCoefExpr: string;
  boxDeliveryMarketplaceLiter: string;
  boxStorageBase: string;
  boxStorageCoefExpr: string;
  boxStorageLiter: string;
  geoName: string;
  warehouseName: string;
}

export interface DatabaseTables {
  tariff_periods: TariffPeriod;
  warehouses: Warehouse;
  box_tariffs: BoxTariff;
  google_sheets_config: GoogleSheetsConfig;
  sync_logs: SyncLog;
}
