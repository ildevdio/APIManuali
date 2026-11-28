import { describe, it, expect } from 'vitest';
import { api, ID_INEXISTENTE, criarProduto, criarUsuario, aguardarEstoque, CEP_VALIDO } from '../helpers/api.js';

describe('Pedidos e estoque — TC11, TC12, TC13 e TC14', () => {
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
      itens: [{ idProduto: ID_INEXISTENTE, quantidade: 1 }],
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

    const inexistente = await api.get(`/api/pedidos/${ID_INEXISTENTE}`);
    expect(inexistente.status).toBe(404);
  });

  it('TC12: checkout com sucesso devolve total, subtotais, reduz estoque e é consultável', async () => {
    const a = await criarProduto({ preco: 12.5, estoque: 10 });
    const b = await criarProduto({ preco: 40, estoque: 4 });

    const res = await api.post('/api/pedidos').send({
      itens: [
        { idProduto: a.body.id, quantidade: 2 },
        { idProduto: b.body.id, quantidade: 1 }
      ],
      cep: CEP_VALIDO
    });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/pedidos/${res.body.idPedido}`);
    expect(res.body.total).toBe(65);
    expect(res.body.concluido).toBe(false);
    expect(res.body.itens).toHaveLength(2);
    expect(res.body.itens).toEqual(expect.arrayContaining([
      expect.objectContaining({ idProduto: a.body.id, quantidade: 2, precoUnitario: 12.5, subtotal: 25 }),
      expect.objectContaining({ idProduto: b.body.id, quantidade: 1, precoUnitario: 40, subtotal: 40 })
    ]));

    expect((await api.get(`/api/products/${a.body.id}`)).body.estoque).toBe(8);
    expect((await api.get(`/api/products/${b.body.id}`)).body.estoque).toBe(3);

    const consultado = await api.get(`/api/pedidos/${res.body.idPedido}`);
    expect(consultado.status).toBe(200);
    expect(consultado.body).toEqual(res.body);
  });

  it('TC12: carrinho → pedido mantém itens e total consistentes', async () => {
    const usuario = await criarUsuario();
    const produto = await criarProduto({ preco: 20, estoque: 6 });
    const usuarioId = usuario.body.id;

    const add = await api
      .post(`/api/carrinho/itens?usuarioId=${usuarioId}`)
      .send({ idProduto: produto.body.id, quantidade: 3 });
    expect(add.status).toBe(200);

    const carrinho = await api.get(`/api/carrinho/itens?usuarioId=${usuarioId}`);
    expect(carrinho.status).toBe(200);

    const pedido = await api.post('/api/pedidos').send({
      itens: carrinho.body.itens.map((i) => ({ idProduto: i.idProduto, quantidade: i.quantidade })),
      cep: CEP_VALIDO,
      usuarioId
    });

    expect(pedido.status).toBe(201);
    expect(pedido.body.total).toBe(carrinho.body.total);
    expect(pedido.body.itens[0]).toMatchObject({ idProduto: produto.body.id, quantidade: 3, subtotal: 60 });
    expect((await api.get(`/api/products/${produto.body.id}`)).body.estoque).toBe(3);
  });

  it('TC13: duas compras simultâneas do último item — uma 201, outra 409, estoque 0', async () => {
    const produto = await criarProduto({ preco: 10, estoque: 1 });
    const corpo = { itens: [{ idProduto: produto.body.id, quantidade: 1 }], cep: CEP_VALIDO };

    const [r1, r2] = await Promise.all([
      api.post('/api/pedidos').send(corpo),
      api.post('/api/pedidos').send(corpo)
    ]);

    expect([r1.status, r2.status].sort()).toEqual([201, 409]);
    const final = await api.get(`/api/products/${produto.body.id}`);
    expect(final.body.estoque).toBe(0);
  });

  // (estoque >= qtd), então a concorrência gera só 201 ou 409, nunca 500.
  it('TC13/DEF: várias compras simultâneas geram só 201 ou 409 (nunca 500)', async () => {
    const produto = await criarProduto({ preco: 10, estoque: 3 });
    const corpo = { itens: [{ idProduto: produto.body.id, quantidade: 1 }], cep: CEP_VALIDO };

    const respostas = await Promise.all(Array.from({ length: 8 }, () => api.post('/api/pedidos').send(corpo)));

    expect(respostas.filter((r) => r.status === 500)).toHaveLength(0);
    expect(respostas.filter((r) => r.status === 201)).toHaveLength(3);
    expect(respostas.filter((r) => r.status === 409)).toHaveLength(5);
    expect((await api.get(`/api/products/${produto.body.id}`)).body.estoque).toBe(0);
  });

  it('TC14: PATCH /:id/status com status válido retorna 200', async () => {
    const produto = await criarProduto({ estoque: 5 });
    const criado = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 1 }],
      cep: CEP_VALIDO
    });

    for (const status of ['aprovado', 'preparado', 'enviado', 'entregue']) {
      const res = await api.patch(`/api/pedidos/${criado.body.idPedido}/status`).send({ status });
      expect(res.status).toBe(200);
      expect(res.body.idPedido).toBe(criado.body.idPedido);
    }
  });

  it('TC14: PATCH /:id/status com id inexistente retorna 404', async () => {
    const res = await api.patch(`/api/pedidos/${ID_INEXISTENTE}/status`).send({ status: 'pago' });
    expect(res.status).toBe(404);
  });

  it('TC14: PATCH /:id/status sem status ou com id inválido retorna 400', async () => {
    const semStatus = await api.patch(`/api/pedidos/${ID_INEXISTENTE}/status`).send({});
    expect(semStatus.status).toBe(400);

    const idInvalido = await api.patch('/api/pedidos/abc/status').send({ status: 'pago' });
    expect(idInvalido.status).toBe(400);
  });

  it.fails('TC14/DEF: status inválido deveria retornar 400 (hoje retorna 500)', async () => {
    const produto = await criarProduto({ estoque: 5 });
    const criado = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 1 }],
      cep: CEP_VALIDO
    });

    const res = await api.patch(`/api/pedidos/${criado.body.idPedido}/status`).send({ status: 'xyz-invalido' });
    expect(res.status).toBe(400);
  });

  it('TC14/DEF: pedido deveria expor o status atualizado', async () => {
    const produto = await criarProduto({ estoque: 5 });
    const criado = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 1 }],
      cep: CEP_VALIDO
    });
    await api.patch(`/api/pedidos/${criado.body.idPedido}/status`).send({ status: 'enviado' });

    const consultado = await api.get(`/api/pedidos/${criado.body.idPedido}`);
    expect(consultado.body.status).toBe('enviado');
  });

  it('TC14: PUT /:id atualiza cep e concluído; valida corpo e id inexistente', async () => {
    const produto = await criarProduto({ estoque: 5 });
    const criado = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 1 }],
      cep: CEP_VALIDO
    });

    const ok = await api.put(`/api/pedidos/${criado.body.idPedido}`).send({ cep: '98765-432', concluido: true });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ idPedido: criado.body.idPedido, cep: '98765-432', concluido: true });

    const invalido = await api.put(`/api/pedidos/${criado.body.idPedido}`).send({ cep: CEP_VALIDO });
    expect(invalido.status).toBe(400);

    const inexistente = await api.put(`/api/pedidos/${ID_INEXISTENTE}`).send({ cep: CEP_VALIDO, concluido: false });
    expect(inexistente.status).toBe(404);
  });

  it('TC14: lista aceita filtro por usuarioId inexistente sem erro', async () => {
    const res = await api.get(`/api/pedidos?usuarioId=${ID_INEXISTENTE}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('filtra pedidos por usuarioId', async () => {
    const usuario = await criarUsuario();
    const produto = await criarProduto({ estoque: 5 });
    const criado = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 1 }],
      cep: CEP_VALIDO,
      usuarioId: usuario.body.id
    });

    expect(criado.status).toBe(201);

    const filtrados = await api.get(`/api/pedidos?usuarioId=${usuario.body.id}`);

    expect(filtrados.status).toBe(200);
    expect(filtrados.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ idPedido: criado.body.idPedido, usuarioId: usuario.body.id })
    ]));
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