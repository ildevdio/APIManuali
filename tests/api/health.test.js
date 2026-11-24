import { describe, it, expect } from 'vitest';
import { api } from '../helpers/api.js';

describe('Health check', () => {
  it('GET /health retorna 200 e status ok', async () => {
    const res = await api.get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  it('rota inexistente retorna 404 com mensagem padronizada', async () => {
    const res = await api.get('/rota-que-nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Rota não encontrada.');
  });
});
