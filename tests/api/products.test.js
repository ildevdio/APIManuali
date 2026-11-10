import { describe, it, expect } from 'vitest';
import { api, criarProduto } from '../helpers/api.js';

describe('Produtos — TC06, TC08 e TC09', () => {
  it('TC06: cria produto persistindo categoria, fotos e história', async () => {
    const res = await criarProduto();

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/products/${res.body.id}`);
    expect(res.body).toMatchObject({
      categoria: 'ceramica',
      historia: 'História de teste',
      ativo: true,
      estoque: 10
    });
    expect(res.body.fotos).toEqual(['https://example.com/foto.jpg']);
  });

  it('TC08: listagem retorna o produto cadastrado', async () => {
    const criado = await criarProduto();

    const res = await api.get('/api/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((produto) => produto.id === criado.body.id)).toBe(true);
  });

  it('TC09: consulta por id retorna os dados do produto', async () => {
    const criado = await criarProduto();

    const res = await api.get(`/api/products/${criado.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(criado.body.id);
    expect(res.body.nome).toBe(criado.body.nome);
    expect(res.body.categoria).toBe('ceramica');
  });

  it('produto inexistente retorna 404', async () => {
    const res = await api.get('/api/products/999999');

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não foi encontrado/);
  });

  it('filtra produtos por categoria e por ativo', async () => {
    const criado = await criarProduto({ categoria: 'bordado', ativo: true });

    const porCategoria = await api.get('/api/products?categoria=bordado');
    expect(porCategoria.status).toBe(200);
    expect(porCategoria.body.every((produto) => produto.categoria === 'bordado')).toBe(true);
    expect(porCategoria.body.some((produto) => produto.id === criado.body.id)).toBe(true);

    const porAtivo = await api.get('/api/products?ativo=true');
    expect(porAtivo.status).toBe(200);
    expect(porAtivo.body.every((produto) => produto.ativo === true)).toBe(true);
  });

  it('busca produtos por nome', async () => {
    const criado = await criarProduto({ nome: 'Caneca de Barro Única' });

    const res = await api.get('/api/products/search?nome=caneca');

    expect(res.status).toBe(200);
    expect(res.body.some((produto) => produto.id === criado.body.id)).toBe(true);
  });

  it('preço inválido é rejeitado com 400', async () => {
    const res = await criarProduto({ preco: -10 });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Erro de validação.');
  });

  it('atualiza e remove produto', async () => {
    const criado = await criarProduto({ estoque: 7 });

    const atualizado = await api.put(`/api/products/${criado.body.id}`).send({
      nome: 'Produto Atualizado',
      descricao: 'Nova descrição',
      preco: 15,
      estoque: 3,
      ativo: false,
      categoria: 'madeira',
      fotos: [],
      historia: 'Nova história'
    });

    expect(atualizado.status).toBe(200);
    expect(atualizado.body).toMatchObject({ nome: 'Produto Atualizado', estoque: 3, ativo: false });

    const removido = await api.delete(`/api/products/${criado.body.id}`);
    expect(removido.status).toBe(204);

    const busca = await api.get(`/api/products/${criado.body.id}`);
    expect(busca.status).toBe(404);
  });
});
