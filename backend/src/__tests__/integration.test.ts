import request from 'supertest';
import { createApp } from '../adapters/inbound/http/app';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /routes', () => {
  it('returns all 5 seed routes', async () => {
    const res = await request(app).get('/routes');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(5);
  });

  it('filters by vesselType', async () => {
    const res = await request(app).get('/routes?vesselType=Container');
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: any) => r.vesselType === 'Container')).toBe(true);
  });

  it('filters by year', async () => {
    const res = await request(app).get('/routes?year=2025');
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: any) => r.year === 2025)).toBe(true);
  });
});

describe('POST /routes/:id/baseline', () => {
  it('sets baseline for a valid routeId', async () => {
    const res = await request(app).post('/routes/R002/baseline');
    expect(res.status).toBe(200);
    expect(res.body.data.routeId).toBe('R002');
    expect(res.body.data.isBaseline).toBe(true);
  });

  it('returns 404 for unknown route', async () => {
    const res = await request(app).post('/routes/UNKNOWN/baseline');
    expect(res.status).toBe(404);
  });
});

describe('GET /routes/comparison', () => {
  it('returns comparison results', async () => {
    const res = await request(app).get('/routes/comparison');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('percentDiff');
    expect(res.body.data[0]).toHaveProperty('compliant');
  });
});

describe('GET /compliance/cb', () => {
  it('computes CB for a valid ship', async () => {
    const res = await request(app).get('/compliance/cb?shipId=R002&year=2024');
    expect(res.status).toBe(200);
    expect(res.body.data.cbGco2eq).toBeGreaterThan(0);
  });

  it('returns 400 when missing params', async () => {
    const res = await request(app).get('/compliance/cb?shipId=R002');
    expect(res.status).toBe(400);
  });
});

describe('POST /banking/bank', () => {
  it('banks surplus for a compliant route', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'R002', year: 2024 });
    expect(res.status).toBe(201);
    expect(res.body.data.amountGco2eq).toBeGreaterThan(0);
  });

  it('returns 400 when banking a deficit', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'R001', year: 2024 });
    expect(res.status).toBe(400);
  });
});

describe('POST /banking/apply', () => {
  it('applies banked surplus', async () => {
    // First bank
    await request(app).post('/banking/bank').send({ shipId: 'R002', year: 2024 });

    const res = await request(app)
      .post('/banking/apply')
      .send({ shipId: 'R002', year: 2024, amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.applied).toBe(100);
  });
});
