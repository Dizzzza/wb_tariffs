import axios, { type AxiosInstance } from 'axios';
import type { TariffsBoxResponse } from '../types/wildberriesApi.js';

export class WildberriesApiService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://common-api.wildberries.ru/api/v1',
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WB-Tariffs-Service/1.0',
        ...(process.env.API_ACCESS_TOKEN && {
          Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`,
        }),
      },
    });
  }

  async getBoxTariffs(date?: string): Promise<TariffsBoxResponse> {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `/tariffs/box?date=${dateParam}`;

    console.log(
      `[WB API] Запрос тарифов: ${this.axiosInstance.defaults.baseURL}${url}`,
    );

    try {
      const response = await this.axiosInstance.get<TariffsBoxResponse>(url);
      const data = response.data;

      console.log(
        `[WB API] Получено тарифов для ${
          data.response.data.warehouseList?.length || 0
        } складов`,
      );

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Таймаут запроса к API Wildberries (30000ms)');
        }
        if (error.response) {
          throw new Error(
            `HTTP ${error.response.status}: ${error.response.statusText}`,
          );
        }
        throw new Error(`Ошибка запроса к API Wildberries: ${error.message}`);
      }
      throw new Error(
        `Неизвестная ошибка при запросе к API Wildberries: ${error}`,
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getBoxTariffs();
      return true;
    } catch (error) {
      console.error('[WB API] Health check failed:', error);
      return false;
    }
  }
}
