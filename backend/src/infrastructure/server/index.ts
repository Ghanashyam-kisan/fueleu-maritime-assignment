import { createApp } from '../../adapters/inbound/http/app';

const PORT = process.env.PORT ?? 4000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚢 FuelEU Backend running on http://localhost:${PORT}`);
});

export default app;
