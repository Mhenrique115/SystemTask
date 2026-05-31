import { Response, NextFunction } from 'express';
import { ChamadoService } from '../services/chamado.service';
import { createChamadoSchema, updateChamadoSchema } from '../schemas';
import { AuthRequest } from '../middlewares/auth.middleware';

const chamadoService = new ChamadoService();

export class ChamadoController {
  private getClienteUserId(req: AuthRequest, res: Response): string | null {
    if (!req.user) {
      res.status(401).json({ error: 'Nao autenticado' });
      return null;
    }

    if (req.user.role !== 'cliente') {
      res.status(403).json({ error: 'Acesso permitido apenas para clientes' });
      return null;
    }

    return req.user.userId;
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chamados = await chamadoService.findAll();
      res.json(chamados);
    } catch (err) {
      next(err);
    }
  }

  async findMeusChamados(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clienteId = this.getClienteUserId(req, res);
      if (!clienteId) return;

      const chamados = await chamadoService.findByCliente(clienteId);
      res.json(chamados);
    } catch (err) {
      next(err);
    }
  }

  async findMeuChamadoById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clienteId = this.getClienteUserId(req, res);
      if (!clienteId) return;

      const chamado = await chamadoService.findByIdForCliente(req.params.id, clienteId);
      res.json(chamado);
    } catch (err) {
      next(err);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chamado = await chamadoService.findById(req.params.id);
      res.json(chamado);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createChamadoSchema.parse(req.body);
      const chamado = await chamadoService.create(data);
      res.status(201).json(chamado);
    } catch (err) {
      if (err instanceof Error && err.message === 'CLIENTE_NOT_FOUND') {
        res.status(404).json({ error: 'Cliente nao encontrado' });
        return;
      }
      if (err instanceof Error && err.message === 'CLIENTE_INVALIDO') {
        res.status(400).json({ error: 'Usuario informado nao e cliente' });
        return;
      }
      if (err instanceof Error && err.message === 'CLIENTE_INATIVO') {
        res.status(400).json({ error: 'Cliente inativo' });
        return;
      }
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateChamadoSchema.parse(req.body);
      const chamado = await chamadoService.update(req.params.id, data);
      res.json(chamado);
    } catch (err) {
      if (err instanceof Error && err.message === 'CLIENTE_NOT_FOUND') {
        res.status(404).json({ error: 'Cliente nao encontrado' });
        return;
      }
      if (err instanceof Error && err.message === 'CLIENTE_INVALIDO') {
        res.status(400).json({ error: 'Usuario informado nao e cliente' });
        return;
      }
      if (err instanceof Error && err.message === 'CLIENTE_INATIVO') {
        res.status(400).json({ error: 'Cliente inativo' });
        return;
      }
      next(err);
    }
  }

  async finalizar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chamado = await chamadoService.finalizar(req.params.id);
      res.json(chamado);
    } catch (err) {
      if (err instanceof Error && err.message === 'Chamado já finalizado') {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await chamadoService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await chamadoService.getDashboard();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}
