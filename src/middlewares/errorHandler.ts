import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../errors/ApiError';

// Centralized HTTP error handler
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Dados invalidos',
      issues: err.issues
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Erro interno no servidor' });
}
