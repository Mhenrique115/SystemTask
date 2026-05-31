import { Response, NextFunction } from 'express';
import { TarefaService } from '../services/tarefa.service';
import { createTarefaSchema } from '../schemas';
import { AuthRequest } from '../middlewares/auth.middleware';

const tarefaService = new TarefaService();

export class TarefaController {
  async findByChamado(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tarefas = await tarefaService.findByChamado(req.params.chamadoId);
      res.json(tarefas);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createTarefaSchema.parse(req.body);
      const tarefa = await tarefaService.create(req.params.chamadoId, data);
      res.status(201).json(tarefa);
    } catch (err) {
      next(err);
    }
  }

  async fechar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tarefa = await tarefaService.fechar(req.params.id);
      res.json(tarefa);
    } catch (err) {
      if (err instanceof Error && err.message === 'Tarefa já está fechada') {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await tarefaService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
