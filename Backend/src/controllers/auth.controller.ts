import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../schemas';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof Error && (err.message === 'Credenciais inválidas' || err.message === 'Usuário inativo')) {
        res.status(401).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
}
