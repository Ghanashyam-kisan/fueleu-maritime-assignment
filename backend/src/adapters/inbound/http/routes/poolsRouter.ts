import { Router, Request, Response } from 'express';
import { CreatePoolUseCase } from '../../../../core/application/use-cases/CreatePool';
import type { IPoolRepository, IComplianceRepository } from '../../../../core/ports/repositories';

export function createPoolsRouter(
  poolRepo: IPoolRepository,
  complianceRepo: IComplianceRepository
): Router {
  const router = Router();
  const createPoolUC = new CreatePoolUseCase(poolRepo, complianceRepo);

  // POST /pools
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { year, members } = req.body;
      if (!year || !Array.isArray(members) || members.length < 2) {
        return res.status(400).json({
          error: 'year and members array (min 2) are required',
        });
      }
      const pool = await createPoolUC.execute({ year: Number(year), members });
      return res.status(201).json({ data: pool });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  });

  // GET /pools/:id
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const pool = await poolRepo.findPool(req.params.id);
      if (!pool) return res.status(404).json({ error: 'Pool not found' });
      return res.json({ data: pool });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
