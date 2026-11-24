import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from './src/middleware/errorHandler.js';
import {
  NotFoundError, ConflictError, BadRequestError,
  InternalServerError, UnauthorizedError
} from './src/utils/errors.js';

const resFalso = () => ({
  status(c) { this.codigo = c; return this; },
  json(b)   { this.corpo = b;  return this; }
});

for (const [Classe, status] of [
  [NotFoundError, 404], [ConflictError, 409],
  [BadRequestError, 400], [InternalServerError, 500]
]) {
  test(`${Classe.name}: propriedades e resposta`, () => {
    const e = new Classe('msg');
    assert.equal(e.name, Classe.name);
    assert.equal(e.statusCode, status);
    assert.ok(e instanceof Error);

    const res = resFalso();
    errorHandler(e, {}, res, () => {});
    assert.equal(res.codigo, status);
    assert.deepEqual(res.corpo, { erro: 'msg' });
  });
}

test('JSON inválido: 400', () => {
  const err = Object.assign(new SyntaxError('x'), { status: 400, body: '{' });
  const res = resFalso();
  errorHandler(err, {}, res, () => {});
  assert.equal(res.codigo, 400);
  assert.deepEqual(res.corpo, { erro: 'JSON inválido.' });
});

test('Error comum: 500 sem vazar mensagem', () => {
  const res = resFalso();
  errorHandler(new Error('falha interna'), {}, res, () => {});
  assert.equal(res.codigo, 500);
  assert.deepEqual(res.corpo, { erro: 'Erro interno do servidor.' });
});

test('UnauthorizedError 401 sem alterar handler', () => {
  const res = resFalso();
  errorHandler(new UnauthorizedError('x'), {}, res, () => {});
  assert.equal(res.codigo, 401);
  assert.deepEqual(res.corpo, { erro: 'x' });
});