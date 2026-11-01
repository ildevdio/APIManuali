import express from 'express';
import pedidoService from '../services/PedidoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
  buscarPorId: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  },
  criar: {
    body: {
      itens: { type: 'array', required: true },
      cep: { type: 'cep', required: true }
    }
  },
  atualizar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    },
    body: {
      cep: { type: 'cep', required: true },
      concluido: { type: 'boolean', required: true }
    }
  },
  deletar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  }
};

// GET: /api/pedidos
router.get('/', asyncHandler(async (req, res) => {
  const pedidos = pedidoService.listar();
  res.json(pedidos);
}));

// GET: /api/pedidos/5
router.get('/:id', validate(schemas.buscarPorId), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const pedido = pedidoService.buscarPorId(id);
  res.json(pedido);
}));

// POST: /api/pedidos
router.post('/', validate(schemas.criar), asyncHandler(async (req, res) => {
  const dto = req.body;
  if (!dto.itens || dto.itens.length === 0) {
    return res.status(400).json({ erro: 'O pedido precisa ter pelo menos um item.' });
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
router.put('/:id', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dto = req.body;
  const pedido = await pedidoService.atualizar(id, dto);
  res.json(pedido);
}));

// DELETE: /api/pedidos/5
router.delete('/:id', validate(schemas.deletar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await pedidoService.deletar(id);
  res.status(204).send();
}));

export default router;
