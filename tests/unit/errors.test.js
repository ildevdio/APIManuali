import { describe, it, expect } from 'vitest';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  InternalServerError,
  ValidationError
} from '../../src/utils/errors.js';

describe('utils/errors.js', () => {
  it('NotFoundError → 404', () => {
    const erro = new NotFoundError('não encontrado');
    expect(erro).toBeInstanceOf(Error);
    expect(erro.statusCode).toBe(404);
    expect(erro.name).toBe('NotFoundError');
    expect(erro.message).toBe('não encontrado');
  });

  it('ConflictError → 409', () => {
    const erro = new ConflictError('conflito');
    expect(erro.statusCode).toBe(409);
    expect(erro.name).toBe('ConflictError');
  });

  it('BadRequestError → 400', () => {
    const erro = new BadRequestError('requisição inválida');
    expect(erro.statusCode).toBe(400);
    expect(erro.name).toBe('BadRequestError');
  });

  it('InternalServerError → 500 com mensagem padrão', () => {
    const erro = new InternalServerError();
    expect(erro.statusCode).toBe(500);
    expect(erro.message).toBe('Erro interno do servidor.');
  });

  it('ValidationError → 400 com lista de erros', () => {
    const erros = [{ campo: 'nome', mensagem: 'nome é obrigatório.' }];
    const erro = new ValidationError(erros);
    expect(erro.statusCode).toBe(400);
    expect(erro.name).toBe('ValidationError');
    expect(erro.errors).toEqual(erros);
  });
});
