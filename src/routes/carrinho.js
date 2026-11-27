import express from 'express';
import carrinhoService from '../services/CarrinhoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import exigirUsuarioId from '../middleware/exigirUsuarioId.js';

const router = express.Router();

const schemas = {
  adicionar: {
    body: {
      idProduto: { type: 'uuid', required: true },
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
router.get('/', exigirUsuarioId, asyncHandler(async (req, res) => {
  const carrinho = await carrinhoService.obterOuCriar(req.usuarioId);
  res.json(carrinho);
}));

// GET: /api/carrinho/itens - listar itens com detalhes
router.get('/itens', exigirUsuarioId, asyncHandler(async (req, res) => {
  const resultado = await carrinhoService.listarItens(req.usuarioId);
  res.json(resultado);
}));

// POST: /api/carrinho/itens - adicionar item
router.post('/itens', validate(schemas.adicionar), exigirUsuarioId, asyncHandler(async (req, res) => {
  const { idProduto, quantidade } = req.body;
  const carrinho = await carrinhoService.adicionarItem(req.usuarioId, idProduto, quantidade);
  res.json(carrinho);
}));

// PUT: /api/carrinho/itens/:idProduto - atualizar quantidade
router.put('/itens/:idProduto', validate(schemas.atualizar), exigirUsuarioId, asyncHandler(async (req, res) => {
  const idProduto = req.params.idProduto;
  const { quantidade } = req.body;
  const carrinho = await carrinhoService.atualizarItem(req.usuarioId, idProduto, quantidade);
  res.json(carrinho);
}));

// DELETE: /api/carrinho/itens/:idProduto - remover item
router.delete('/itens/:idProduto', exigirUsuarioId, asyncHandler(async (req, res) => {
  const idProduto = req.params.idProduto;
  const carrinho = carrinhoService.removerItem(req.usuarioId, idProduto);
  res.json(carrinho);
}));

// DELETE: /api/carrinho - limpar carrinho
router.delete('/', exigirUsuarioId, asyncHandler(async (req, res) => {
  const carrinho = carrinhoService.limpar(req.usuarioId);
  res.json(carrinho);
}));

export default router;