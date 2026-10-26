import express from 'express';
import pedidoService from '../services/PedidoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET: /api/pedidos
router.get('/', asyncHandler(async (req, res) => {
  const pedidos = pedidoService.listar();
  res.json(pedidos);
}));

// GET: /api/pedidos/5
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const pedido = pedidoService.buscarPorId(id);
  res.json(pedido);
}));

// POST: /api/pedidos
router.post('/', asyncHandler(async (req, res) => {
  const dto = req.body;
  if (!dto || !dto.itens || !Array.isArray(dto.itens) || dto.itens.length === 0 || !dto.cep) {
    return res.status(400).json({ erro: 'Campos obrigatórios: itens (array), cep.' });
  }
  for (const item of dto.itens) {
    if (!item.idProduto || !item.quantidade || item.quantidade <= 0) {
      return res.status(400).json({ erro: 'Cada item deve ter idProduto e quantidade (> 0).' });
    }
  }
  const pedido = await pedidoService.criar(dto);
  res.status(201).location(`/api/pedidos/${pedido.idPedido}`).json(pedido);
}));

// PUT: /api/pedidos/5
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const dto = req.body;
  if (!dto || !dto.cep || dto.concluido === undefined) {
    return res.status(400).json({ erro: 'Campos obrigatórios: cep, concluido.' });
  }
  const pedido = await pedidoService.atualizar(id, dto);
  res.json(pedido);
}));

// DELETE: /api/pedidos/5
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  await pedidoService.deletar(id);
  res.status(204).send();
}));

export default router;