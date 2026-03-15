import { Router, Request, Response } from 'express';
import { BankSurplusUseCase } from '../../../../core/application/use-cases/BankSurplus';
import { ApplyBankedUseCase } from '../../../../core/application/use-cases/ApplyBanked';
import type { IRouteRepository, IBankingRepository } from '../../../../core/ports/repositories';

export function createBankingRouter(
  routeRepo: IRouteRepository,
  bankingRepo: IBankingRepository
): Router {
  const router = Router();
  const bankSurplusUC = new BankSurplusUseCase(routeRepo, bankingRepo);
  const applyBankedUC = new ApplyBankedUseCase(bankingRepo);

  // GET /banking/records?shipId=&year=
  router.get('/records', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }
      const records = await bankingRepo.findByShip(shipId as string, Number(year));
      const total = await bankingRepo.getTotalBanked(shipId as string, Number(year));
      return res.json({ data: { records, totalBanked: total } });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  });

  // POST /banking/bank
  router.post('/bank', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.body;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }
      const entry = await bankSurplusUC.execute({ shipId, year: Number(year) });
      return res.status(201).json({ data: entry });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  });

  // POST /banking/apply
  router.post('/apply', async (req: Request, res: Response) => {
    try {
      const { shipId, year, amount } = req.body;
      if (!shipId || !year || amount === undefined) {
        return res.status(400).json({ error: 'shipId, year, and amount are required' });
      }
      const result = await applyBankedUC.execute({
        shipId,
        year: Number(year),
        amount: Number(amount),
      });
      return res.json({ data: result });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  });

  return router;
}
