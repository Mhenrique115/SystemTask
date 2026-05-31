import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { createUserSchema, searchClientesSchema, updateUserSchema } from '../schemas';
import { AuthRequest } from '../middlewares/auth.middleware';

const userService = new UserService();

export class UserController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.findById(req.params.id);
      res.json(user);
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
          res.status(404).json({ error: 'Usuario nao encontrado' });
          return;
      }
      next(err);
    }
  }

  async findClientes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = searchClientesSchema.parse(req.query);
      const clientes = await userService.findClientes(filters);
      res.json(clientes);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create(data);
      res.status(201).json(user);
    } catch (err) {
      if (
          err instanceof Error &&
          (err.message === 'Username ja existe' || err.message === 'Email ja existe')
      ) {
          res.status(409).json({ error: err.message });
          return;
      }
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await userService.update(req.params.id, data);
      res.json(user);
    } catch (err) {
      if (
          err instanceof Error &&
          (err.message === 'Username ja existe' || err.message === 'Email ja existe')
      ) {
          res.status(409).json({ error: err.message });
          return;
      }
      if (err instanceof Error && err.message === 'NOT_FOUND') {
          res.status(404).json({ error: 'Usuario nao encontrado' });
          return;
      }
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
          res.status(404).json({ error: 'Usuario nao encontrado' });
          return;
      }
      next(err);
    }
  }
}
