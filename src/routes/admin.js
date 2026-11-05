import express from 'express';
import pedidoService from '../services/PedidoService.js';
import productService from '../services/ProductService.js';
import artesaoService from '../services/ArtesaoService.js';
import usuarioService from '../services/UsuarioService.js';
import avaliacaoService from '../services/AvaliacaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET: /api/admin/metricas/vendas
router.get('/metricas/vendas', asyncHandler(async (req, res) => {
  const pedidos = pedidoService.listar();
  const totalPedidos = pedidos.length;
  const totalVendas = pedidos.reduce((sum, p) => sum + p.total, 0);
  const entregues = pedidos.filter(p => p.concluido).length;
  const pendentes = pedidos.filter(p => !p.concluido).length;
  res.json({
    totalPedidos,
    totalVendas,
    pedidosEntregues: entregues,
    pedidosPendentes: pendentes,
    ticketMedio: totalPedidos > 0 ? totalVendas / totalPedidos : 0
  });
}));

// GET: /api/admin/metricas/produtos
router.get('/metricas/produtos', asyncHandler(async (req, res) => {
  const produtos = productService.listar();
  const totalProdutos = produtos.length;
  const ativos = produtos.filter(p => p.ativo).length;
  const inativos = produtos.filter(p => !p.ativo).length;
  const estoqueTotal = produtos.reduce((sum, p) => sum + p.estoque, 0);
  res.json({
    totalProdutos,
    produtosAtivos: ativos,
    produtosInativos: inativos,
    estoqueTotal
  });
}));

// GET: /api/admin/metricas/artesaos
router.get('/metricas/artesaos', asyncHandler(async (req, res) => {
  const artesaos = artesaoService.listar();
  res.json({
    totalArtesãos: artesaos.length,
    artesaos
  });
}));

// GET: /api/admin/metricas/consumidores
router.get('/metricas/consumidores', asyncHandler(async (req, res) => {
  const usuarios = usuarioService.listar();
  const totalUsuarios = usuarios.length;
  const pedidos = pedidoService.listar();
  const compradores = [...new Set(pedidos.map(p => p.usuarioId).filter(Boolean))];
  res.json({
    totalUsuarios,
    totalCompradores: compradores.length
  });
}));

// GET: /api/admin/metricas/geral
router.get('/metricas/geral', asyncHandler(async (req, res) => {
  const pedidos = pedidoService.listar();
  const produtos = productService.listar();
  const artesaos = artesaoService.listar();
  const usuarios = usuarioService.listar();
  const avaliacoes = [];
  const totalVendas = pedidos.reduce((sum, p) => sum + p.total, 0);
  const mediaAvaliacoes = avaliacaoService.mediaPorProduto(0);

  res.json({
    totalVendas,
    totalPedidos: pedidos.length,
    totalProdutos: produtos.length,
    totalArtesãos: artesaos.length,
    totalUsuarios: usuarios.length,
    ticketMedio: pedidos.length > 0 ? totalVendas / pedidos.length : 0,
    produtosAtivos: produtos.filter(p => p.ativo).length,
    pedidosPendentes: pedidos.filter(p => !p.concluido).length
  });
}));

export default router;
