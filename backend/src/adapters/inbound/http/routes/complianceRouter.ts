import { Router, Request, Response } from 'express';
import { ComputeCBUseCase } from '../../../../core/application/use-cases/ComputeCB';
import type { IRouteRepository, IComplianceRepository, IBankingRepository } from '../../../../core/ports/repositories';

export function createComplianceRouter(
  routeRepo: IRouteRepository,
  complianceRepo: IComplianceRepository,
  bankingRepo: IBankingRepository
): Router {
  const router = Router();
  const computeCBUC = new ComputeCBUseCase(routeRepo, complianceRepo);

  // GET /compliance/cb?shipId=&year=
  router.get('/cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }
      const cb = await computeCBUC.execute({
        shipId: shipId as string,
        year: Number(year),
      });
      return res.json({ data: cb });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  });

  // GET /compliance/adjusted-cb?shipId=&year=
  router.get('/adjusted-cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }
      const cb = await computeCBUC.execute({
        shipId: shipId as string,
        year: Number(year),
      });
      const totalBanked = await bankingRepo.getTotalBanked(shipId as string, Number(year));
      return res.json({
        data: {
          ...cb,
          bankedSurplus: totalBanked,
          adjustedCB: cb.cbGco2eq + totalBanked,
        },
      });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  });

  return router;
}
