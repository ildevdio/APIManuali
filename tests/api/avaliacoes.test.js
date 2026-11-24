import { describe, it, expect } from 'vitest';
import { api, criarUsuario, criarProduto } from '../helpers/api.js';

describe('Avaliações — TC15 / DEF03', () => {
  it('cria avaliação e lista por produto com usuário, nota e comentário', async () => {
    const usuario = await criarUsuario();
    const produto = await criarProduto();
    const usuarioId = usuario.body.id;
    const produtoId = produto.body.id;

    const criada = await api
      .post(`/api/avaliacoes?usuarioId=${usuarioId}`)
      .send({ produtoId, nota: 5, comentario: 'Excelente' });

    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({ produtoId, usuarioId, nota: 5, comentario: 'Excelente' });

    const lista = await api.get(`/api/avaliacoes/produto/${produtoId}`);

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ produtoId, usuarioId, nota: 5, comentario: 'Excelente' });
  });

  it('calcula a média das avaliações do produto', async () => {
    const primeiroUsuario = await criarUsuario();
    const segundoUsuario = await criarUsuario();
    const produto = await criarProduto();
    const produtoId = produto.body.id;

    await api
      .post(`/api/avaliacoes?usuarioId=${primeiroUsuario.body.id}`)
      .send({ produtoId, nota: 4 });
    await api
      .post(`/api/avaliacoes?usuarioId=${segundoUsuario.body.id}`)
      .send({ produtoId, nota: 2 });

    const res = await api.get(`/api/avaliacoes/media/${produtoId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ media: 3, total: 2 });
  });

  it('produto sem avaliações retorna lista vazia', async () => {
    const produto = await criarProduto();

    const res = await api.get(`/api/avaliacoes/produto/${produto.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('avaliação duplicada do mesmo usuário retorna 400', async () => {
    const usuario = await criarUsuario();
    const produto = await criarProduto();
    const usuarioId = usuario.body.id;
    const produtoId = produto.body.id;

    const primeira = await api.post(`/api/avaliacoes?usuarioId=${usuarioId}`).send({ produtoId, nota: 5 });
    expect(primeira.status).toBe(201);

    const segunda = await api.post(`/api/avaliacoes?usuarioId=${usuarioId}`).send({ produtoId, nota: 4 });

    expect(segunda.status).toBe(400);
    expect(segunda.body.erro).toBe('Você já avaliou este produto.');
  });

  it('nota inválida retorna 400', async () => {
    const usuario = await criarUsuario();
    const produto = await criarProduto();

    const res = await api
      .post(`/api/avaliacoes?usuarioId=${usuario.body.id}`)
      .send({ produtoId: produto.body.id, nota: 0 });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Erro de validação.');
  });

  it('avaliação sem usuarioId retorna 400', async () => {
    const produto = await criarProduto();

    const res = await api.post('/api/avaliacoes').send({ produtoId: produto.body.id, nota: 5 });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('usuarioId é obrigatório.');
  });
});
