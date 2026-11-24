import { HttpError, ValidationError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      erro: err.message,
      details: err.errors
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }

  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}
