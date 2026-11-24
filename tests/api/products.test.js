import { describe, it, expect } from 'vitest';
import { api, ID_INEXISTENTE, criarProduto } from '../helpers/api.js';

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
    const res = await api.get(`/api/products/${ID_INEXISTENTE}`);

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não foi encontrado/);
  });

  it('id fora do formato UUID retorna 400', async () => {
    const res = await api.get('/api/products/123');

    expect(res.status).toBe(400);
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

  it('TC06: PUT persiste as alterações e GET /:id as devolve', async () => {
    const criado = await criarProduto({ preco: 20, estoque: 5, categoria: 'ceramica' });
    const id = criado.body.id;

    const res = await api.put(`/api/products/${id}`).send({
      nome: 'Vaso Editado',
      descricao: 'Descrição editada',
      preco: 45.5,
      estoque: 9,
      ativo: true,
      categoria: 'madeira',
      fotos: ['https://example.com/nova.jpg'],
      historia: 'História editada'
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      nome: 'Vaso Editado',
      preco: 45.5,
      estoque: 9,
      categoria: 'madeira',
      historia: 'História editada'
    });

    const consulta = await api.get(`/api/products/${id}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body).toMatchObject({ nome: 'Vaso Editado', preco: 45.5, estoque: 9, categoria: 'madeira' });
    expect(consulta.body.fotos).toEqual(['https://example.com/nova.jpg']);
  });

  it('TC06: PUT com dados inválidos retorna 400 sem alterar o produto', async () => {
    const criado = await criarProduto({ preco: 20, estoque: 5 });
    const valido = { nome: 'Ok', preco: 10, estoque: 1, ativo: true };

    const precoNegativo = await api.put(`/api/products/${criado.body.id}`).send({ ...valido, preco: -1 });
    expect(precoNegativo.status).toBe(400);

    const estoqueNegativo = await api.put(`/api/products/${criado.body.id}`).send({ ...valido, estoque: -3 });
    expect(estoqueNegativo.status).toBe(400);

    const semAtivo = await api.put(`/api/products/${criado.body.id}`).send({ nome: 'Ok', preco: 10, estoque: 1 });
    expect(semAtivo.status).toBe(400);

    const idInvalido = await api.put('/api/products/abc').send(valido);
    expect(idInvalido.status).toBe(400);

    const consulta = await api.get(`/api/products/${criado.body.id}`);
    expect(consulta.body).toMatchObject({ preco: 20, estoque: 5 });
  });

  it('TC06: PUT e DELETE de produto inexistente retornam 404; id inválido no DELETE retorna 400', async () => {
    const put = await api.put(`/api/products/${ID_INEXISTENTE}`).send({ nome: 'X', preco: 10, estoque: 1, ativo: true });
    expect(put.status).toBe(404);

    const del = await api.delete(`/api/products/${ID_INEXISTENTE}`);
    expect(del.status).toBe(404);

    const delInvalido = await api.delete('/api/products/abc');
    expect(delInvalido.status).toBe(400);
  });

  it('TC06: DELETE remove o produto da listagem e repetir o DELETE retorna 404', async () => {
    const criado = await criarProduto();

    expect((await api.delete(`/api/products/${criado.body.id}`)).status).toBe(204);

    const lista = await api.get('/api/products');
    expect(lista.body.some((produto) => produto.id === criado.body.id)).toBe(false);

    expect((await api.delete(`/api/products/${criado.body.id}`)).status).toBe(404);
  });

  it('TC06: atualiza e remove produto', async () => {
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
