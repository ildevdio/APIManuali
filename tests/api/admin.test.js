import { describe, it, expect, beforeAll } from 'vitest';
import { api, criarProduto, criarArtesao, criarUsuario, CEP_VALIDO } from '../helpers/api.js';

describe('Painel administrativo e indicadores — TC16', () => {
  beforeAll(async () => {
    const produto = await criarProduto({ preco: 50, estoque: 5 });
    await criarProduto({ ativo: false, estoque: 2 });
    await criarArtesao();
    await criarUsuario();
    const pedido = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 2 }],
      cep: CEP_VALIDO
    });
    expect(pedido.status).toBe(201);
  });

  it('GET /metricas/vendas retorna totais coerentes', async () => {
    const res = await api.get('/api/admin/metricas/vendas');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      totalPedidos: expect.any(Number),
      totalVendas: expect.any(Number),
      pedidosEntregues: expect.any(Number),
      pedidosPendentes: expect.any(Number),
      ticketMedio: expect.any(Number)
    }));
    expect(res.body.totalPedidos).toBeGreaterThanOrEqual(1);
    expect(res.body.totalVendas).toBeGreaterThanOrEqual(100);
    expect(res.body.pedidosEntregues + res.body.pedidosPendentes).toBe(res.body.totalPedidos);
    expect(res.body.ticketMedio).toBeCloseTo(res.body.totalVendas / res.body.totalPedidos);
  });

  // Defeito: routes/admin.js chama productService.listar() (async) sem await;
  // `produtos.filter` falha e a rota responde 500. Correção: `await productService.listar()`.
  it.fails('TC16/DEF: GET /metricas/produtos retorna contagem de ativos, inativos e estoque', async () => {
    const res = await api.get('/api/admin/metricas/produtos');

    expect(res.status).toBe(200);
    expect(res.body.totalProdutos).toBeGreaterThanOrEqual(2);
    expect(res.body.produtosAtivos).toBeGreaterThanOrEqual(1);
    expect(res.body.produtosInativos).toBeGreaterThanOrEqual(1);
    expect(res.body.produtosAtivos + res.body.produtosInativos).toBe(res.body.totalProdutos);
    expect(res.body.estoqueTotal).toBeGreaterThanOrEqual(0);
  });

  it('GET /metricas/artesaos retorna total e lista', async () => {
    const res = await api.get('/api/admin/metricas/artesaos');

    expect(res.status).toBe(200);
    expect(res.body['totalArtesãos']).toBeGreaterThanOrEqual(1);
    expect(res.body.artesaos).toHaveLength(res.body['totalArtesãos']);
  });

  it('GET /metricas/consumidores retorna usuários e compradores', async () => {
    const res = await api.get('/api/admin/metricas/consumidores');

    expect(res.status).toBe(200);
    expect(res.body.totalUsuarios).toBeGreaterThanOrEqual(1);
    expect(res.body.totalCompradores).toBeGreaterThanOrEqual(0);
  });

  // Mesmo defeito de /metricas/produtos (productService.listar() sem await).
  it.fails('TC16/DEF: GET /metricas/geral consolida os indicadores', async () => {
    const geral = await api.get('/api/admin/metricas/geral');
    const vendas = await api.get('/api/admin/metricas/vendas');

    expect(geral.status).toBe(200);
    expect(geral.body).toEqual(expect.objectContaining({
      totalVendas: expect.any(Number),
      totalPedidos: expect.any(Number),
      totalProdutos: expect.any(Number),
      totalUsuarios: expect.any(Number),
      ticketMedio: expect.any(Number),
      produtosAtivos: expect.any(Number),
      pedidosPendentes: expect.any(Number)
    }));
    expect(geral.body.totalPedidos).toBe(vendas.body.totalPedidos);
    expect(geral.body.totalVendas).toBe(vendas.body.totalVendas);
  });

  // Defeito: as rotas do painel não usam exigirAuth('adm'); qualquer um acessa.
  it.fails('TC16/DEF: métricas sem token deveriam retornar 401', async () => {
    const res = await api.get('/api/admin/metricas/geral');
    expect(res.status).toBe(401);
  });
});
