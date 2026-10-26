import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  if (err instanceof ConflictError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  if (err instanceof BadRequestError) {
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