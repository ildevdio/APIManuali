import { describe, it, expect } from 'vitest';
import { api, criarProduto } from '../helpers/api.js';

// TC18: smoke test da aplicação montada. Roda no test:ci, logo após o build.
// Para validar um deploy publicado, use o script `npm run smoke` (BASE_URL).
describe('TC18: smoke test pós-build', () => {
  it('TC18: /health responde ok', async () => {
    const res = await api.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('TC18: leitura de produtos responde 200 com lista', async () => {
    const res = await api.get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('TC18: escrita e releitura passam pela camada de dados', async () => {
    const criado = await criarProduto();
    expect(criado.status).toBe(201);

    const lido = await api.get(`/api/products/${criado.body.id}`);
    expect(lido.status).toBe(200);
    expect(lido.body.nome).toBe(criado.body.nome);
  });

  it('TC18: documentação e rota inexistente respondem como esperado', async () => {
    expect((await api.get('/rota-inexistente')).status).toBe(404);
    expect((await api.get('/api-docs/')).status).toBe(200);
  });
});
