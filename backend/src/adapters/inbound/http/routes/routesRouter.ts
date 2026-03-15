import { Router, Request, Response } from 'express';
import { GetRoutesUseCase } from '../../../../core/application/use-cases/GetRoutes';
import { SetBaselineUseCase } from '../../../../core/application/use-cases/SetBaseline';
import { ComputeComparisonUseCase } from '../../../../core/application/use-cases/ComputeComparison';
import type { IRouteRepository } from '../../../../core/ports/repositories';

export function createRoutesRouter(routeRepo: IRouteRepository): Router {
  const router = Router();

  const getRoutesUC = new GetRoutesUseCase(routeRepo);
  const setBaselineUC = new SetBaselineUseCase(routeRepo);
  const compareUC = new ComputeComparisonUseCase(routeRepo);

  // GET /routes
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { vesselType, fuelType, year } = req.query;
      const routes = await getRoutesUC.execute({
        vesselType: vesselType as string | undefined,
        fuelType: fuelType as string | undefined,
        year: year ? Number(year) : undefined,
      });
      res.json({ data: routes });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /routes/comparison
  router.get('/comparison', async (_req: Request, res: Response) => {
    try {
      const results = await compareUC.execute();
      res.json({ data: results });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // POST /routes/:id/baseline
  router.post('/:id/baseline', async (req: Request, res: Response) => {
    try {
      const route = await setBaselineUC.execute(req.params.id);
      res.json({ data: route });
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  return router;
}
