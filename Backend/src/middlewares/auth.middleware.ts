import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../libs/jwt';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    return;
  }

  next();
}

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'NÃ£o autenticado' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'dev') {
    res.status(403).json({ error: 'Acesso negado. Apenas equipe interna.' });
    return;
  }

  next();
}
