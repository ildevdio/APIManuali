import { describe, it, expect, beforeAll } from 'vitest';
import { api, criarUsuario, criarProduto } from '../helpers/api.js';

describe('Carrinho — TC10 / DEF02', () => {
  let usuarioId;
  let produtoId;
  const precoUnitario = 25;

  beforeAll(async () => {
    const usuario = await criarUsuario();
    const produto = await criarProduto({ preco: precoUnitario, estoque: 10 });

    expect(usuario.status).toBe(201);
    expect(produto.status).toBe(201);

    usuarioId = usuario.body.id;
    produtoId = produto.body.id;
  });

  it('adiciona item ao carrinho', async () => {
    const res = await api
      .post(`/api/carrinho/itens?usuarioId=${usuarioId}`)
      .send({ idProduto: produtoId, quantidade: 2 });

    expect(res.status).toBe(200);
    expect(res.body.usuarioId).toBe(usuarioId);
    expect(res.body.itens).toContainEqual({ idProduto: produtoId, quantidade: 2 });
  });

  it('lista itens com detalhes e subtotal', async () => {
    const res = await api.get(`/api/carrinho/itens?usuarioId=${usuarioId}`);

    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(1);
    expect(res.body.itens[0]).toMatchObject({
      idProduto: produtoId,
      quantidade: 2,
      preco: precoUnitario,
      subtotal: precoUnitario * 2
    });
    expect(res.body.total).toBe(precoUnitario * 2);
  });

  it('atualiza a quantidade de um item', async () => {
    const res = await api
      .put(`/api/carrinho/itens/${produtoId}?usuarioId=${usuarioId}`)
      .send({ quantidade: 3 });

    expect(res.status).toBe(200);
    expect(res.body.itens).toContainEqual({ idProduto: produtoId, quantidade: 3 });
  });

  it('remove item do carrinho', async () => {
    const res = await api.delete(`/api/carrinho/itens/${produtoId}?usuarioId=${usuarioId}`);

    expect(res.status).toBe(200);
    expect(res.body.itens).toEqual([]);
  });

  it('adicionar produto inexistente retorna 404', async () => {
    const res = await api
      .post(`/api/carrinho/itens?usuarioId=${usuarioId}`)
      .send({ idProduto: 999999, quantidade: 1 });

    expect(res.status).toBe(404);
  });

  it('requisição sem usuarioId retorna 400', async () => {
    const res = await api.get('/api/carrinho');

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('usuarioId é obrigatório.');
  });

  it('limpa o carrinho', async () => {
    await api.post(`/api/carrinho/itens?usuarioId=${usuarioId}`).send({ idProduto: produtoId, quantidade: 1 });

    const res = await api.delete(`/api/carrinho?usuarioId=${usuarioId}`);

    expect(res.status).toBe(200);
    expect(res.body.itens).toEqual([]);
  });
});
