import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('[ERROR]', err.message);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.message === 'NOT_FOUND') {
    res.status(404).json({ error: 'Recurso não encontrado' });
    return;
  }

  if (err.message === 'UNAUTHORIZED') {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }

  if (err.message === 'FORBIDDEN') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  res.status(500).json({ error: 'Erro interno do servidor' });
}
