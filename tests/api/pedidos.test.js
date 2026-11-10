import { describe, it, expect } from 'vitest';
import { api, criarProduto, aguardarEstoque, CEP_VALIDO } from '../helpers/api.js';

describe('Pedidos e estoque — TC11, TC13 e TC14', () => {
  it('TC13: pedido reduz estoque e nova compra sem estoque retorna 409', async () => {
    const produto = await criarProduto({ preco: 10, estoque: 5 });
    const idProduto = produto.body.id;

    const primeiro = await api.post('/api/pedidos').send({
      itens: [{ idProduto, quantidade: 3 }],
      cep: CEP_VALIDO
    });

    expect(primeiro.status).toBe(201);
    expect(primeiro.body.total).toBe(30);
    expect(primeiro.body.itens[0]).toMatchObject({ idProduto, quantidade: 3, precoUnitario: 10, subtotal: 30 });

    const aposPrimeiro = await api.get(`/api/products/${idProduto}`);
    expect(aposPrimeiro.body.estoque).toBe(2);

    const segundo = await api.post('/api/pedidos').send({
      itens: [{ idProduto, quantidade: 3 }],
      cep: CEP_VALIDO
    });

    expect(segundo.status).toBe(409);
    expect(segundo.body.erro).toMatch(/Estoque insuficiente/);

    const aposSegundo = await api.get(`/api/products/${idProduto}`);
    expect(aposSegundo.body.estoque).toBe(2);
  });

  it('TC11: checkout com estoque insuficiente é bloqueado com 409', async () => {
    const produto = await criarProduto({ estoque: 1 });

    const res = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 5 }],
      cep: CEP_VALIDO
    });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/Estoque insuficiente/);
  });

  it('TC11: checkout com produto inexistente retorna 404', async () => {
    const res = await api.post('/api/pedidos').send({
      itens: [{ idProduto: 999999, quantidade: 1 }],
      cep: CEP_VALIDO
    });

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não foi encontrado/);
  });

  it('TC14: lista e busca pedidos; id inexistente retorna 404', async () => {
    const produto = await criarProduto({ estoque: 5 });

    const criado = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 1 }],
      cep: CEP_VALIDO
    });
    expect(criado.status).toBe(201);

    const lista = await api.get('/api/pedidos');
    expect(lista.status).toBe(200);
    expect(lista.body.some((pedido) => pedido.idPedido === criado.body.idPedido)).toBe(true);

    const porId = await api.get(`/api/pedidos/${criado.body.idPedido}`);
    expect(porId.status).toBe(200);
    expect(porId.body.idPedido).toBe(criado.body.idPedido);

    const inexistente = await api.get('/api/pedidos/999999');
    expect(inexistente.status).toBe(404);
  });

  it('deletar pedido não concluído devolve o estoque', async () => {
    const produto = await criarProduto({ estoque: 10 });

    const criado = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 4 }],
      cep: CEP_VALIDO
    });
    expect(criado.status).toBe(201);

    const reservado = await api.get(`/api/products/${produto.body.id}`);
    expect(reservado.body.estoque).toBe(6);

    const removido = await api.delete(`/api/pedidos/${criado.body.idPedido}`);
    expect(removido.status).toBe(204);

    const estoqueFinal = await aguardarEstoque(produto.body.id, 10);
    expect(estoqueFinal).toBe(10);
  });

  it('pedido sem itens retorna 400', async () => {
    const res = await api.post('/api/pedidos').send({ itens: [], cep: CEP_VALIDO });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('O pedido precisa ter pelo menos um item.');
  });
});
