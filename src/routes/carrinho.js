import express from 'express';
import carrinhoService from '../services/CarrinhoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
  adicionar: {
    body: {
      idProduto: { type: 'positiveInteger', required: true },
      quantidade: { type: 'positiveInteger', required: true }
    }
  },
  atualizar: {
    body: {
      quantidade: { type: 'positiveInteger', required: true }
    }
  }
};

// GET: /api/carrinho - ver carrinho do usuário (usuárioId via query ou body)
router.get('/', asyncHandler(async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const carrinho = carrinhoService.obterOuCriar(parseInt(usuarioId, 10));
  res.json(carrinho);
}));

// GET: /api/carrinho/itens - listar itens com detalhes
router.get('/itens', asyncHandler(async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const resultado = carrinhoService.listarItens(parseInt(usuarioId, 10));
  res.json(resultado);
}));

// POST: /api/carrinho/itens - adicionar item
router.post('/itens', validate(schemas.adicionar), asyncHandler(async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const { idProduto, quantidade } = req.body;
  const carrinho = carrinhoService.adicionarItem(parseInt(usuarioId, 10), idProduto, quantidade);
  res.json(carrinho);
}));

// PUT: /api/carrinho/itens/:idProduto - atualizar quantidade
router.put('/itens/:idProduto', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const idProduto = parseInt(req.params.idProduto, 10);
  const { quantidade } = req.body;
  const carrinho = carrinhoService.atualizarItem(parseInt(usuarioId, 10), idProduto, quantidade);
  res.json(carrinho);
}));

// DELETE: /api/carrinho/itens/:idProduto - remover item
router.delete('/itens/:idProduto', asyncHandler(async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const idProduto = parseInt(req.params.idProduto, 10);
  const carrinho = carrinhoService.removerItem(parseInt(usuarioId, 10), idProduto);
  res.json(carrinho);
}));

// DELETE: /api/carrinho - limpar carrinho
router.delete('/', asyncHandler(async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const carrinho = carrinhoService.limpar(parseInt(usuarioId, 10));
  res.json(carrinho);
}));

export default router;
