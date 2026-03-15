import express from 'express';
import cors from 'cors';
import { createRoutesRouter } from './routes/routesRouter';
import { createComplianceRouter } from './routes/complianceRouter';
import { createBankingRouter } from './routes/bankingRouter';
import { createPoolsRouter } from './routes/poolsRouter';
import { InMemoryRouteRepository } from '../../outbound/postgres/InMemoryRouteRepository';
import { InMemoryComplianceRepository } from '../../outbound/postgres/InMemoryComplianceRepository';
import { InMemoryBankingRepository } from '../../outbound/postgres/InMemoryBankingRepository';
import { InMemoryPoolRepository } from '../../outbound/postgres/InMemoryPoolRepository';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Instantiate repositories (swap for Postgres adapters when DB is available)
  const routeRepo = new InMemoryRouteRepository();
  const complianceRepo = new InMemoryComplianceRepository();
  const bankingRepo = new InMemoryBankingRepository();
  const poolRepo = new InMemoryPoolRepository();

  // Mount routers
  app.use('/routes', createRoutesRouter(routeRepo));
  app.use('/compliance', createComplianceRouter(routeRepo, complianceRepo, bankingRepo));
  app.use('/banking', createBankingRouter(routeRepo, bankingRepo));
  app.use('/pools', createPoolsRouter(poolRepo, complianceRepo));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}
