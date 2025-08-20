export interface TariffsBoxResponse {
  response: {
    data: WarehousesBoxRates;
  }
}

export interface WarehousesBoxRates {
  dtNextBox: string;
  dtTillMax: string;
  warehouseList: WarehouseBoxRates[] | null;
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
