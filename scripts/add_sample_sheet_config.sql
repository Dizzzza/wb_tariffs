-- Замените 'YOUR_SHEET_ID' на реальный ID вашей Google таблицы

INSERT INTO google_sheets_config (sheet_id, sheet_name, description, is_active)
VALUES (
  'YOUR_SHEET_ID',
  'WB Tariffs Main',
  'Основная таблица с тарифами Wildberries',
  true
)
ON CONFLICT (sheet_id) DO NOTHING;
