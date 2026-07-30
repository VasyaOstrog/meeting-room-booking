import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not found' });
}

export function jsonParseErrorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ message: 'Invalid JSON in request body' });
    return;
  }

  next(error);
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
}
