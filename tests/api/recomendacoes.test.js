import { randomUUID } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { api, criarProduto, criarUsuario } from '../helpers/api.js';

describe('Recomendações', () => {
  it('GET /relacionados/:id retorna produtos da mesma categoria', async () => {
    const categoria = `recomendacao-${randomUUID()}`;
    const produto = await criarProduto({ categoria });
    const relacionado = await criarProduto({ categoria });

    const res = await api.get(`/api/recomendacoes/relacionados/${produto.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: relacionado.body.id })
    ]));
  });

  it('GET /mais-avaliados retorna produtos com avaliações', async () => {
    const usuario = await criarUsuario();
    const produto = await criarProduto();
    const avaliacao = await api
      .post(`/api/avaliacoes?usuarioId=${usuario.body.id}`)
      .send({ produtoId: produto.body.id, nota: 5 });
    expect(avaliacao.status).toBe(201);

    const res = await api.get('/api/recomendacoes/mais-avaliados');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: produto.body.id, media: 5, total: 1 })
    ]));
  });

  it('GET /destaque retorna produtos ativos com estoque', async () => {
    const produto = await criarProduto({ ativo: true, estoque: 5 });

    // Evita que produtos persistidos de execuções anteriores ocupem o limite padrão de 8.
    const res = await api.get(`/api/recomendacoes/destaque?limite=${Number.MAX_SAFE_INTEGER}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: produto.body.id })
    ]));
  });
});
