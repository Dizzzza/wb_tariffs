import { App } from './app.js';

const app = new App();

process.on('SIGINT', async () => {
  console.log('\n[Index] Получен сигнал SIGINT, завершение работы...');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Index] Получен сигнал SIGTERM, завершение работы...');
  await app.stop();
  process.exit(0);
});

app.start().catch((error) => {
  console.error('[Index] Критическая ошибка:', error);
  process.exit(1);
});
