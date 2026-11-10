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

// Middleware: valida e converte o usuarioId uma única vez
function exigirUsuarioId(req, res, next) {
  const usuarioId = parseInt(req.query.usuarioId, 10);

  if (Number.isNaN(usuarioId)) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório e deve ser um número.' });
  }

  req.usuarioId = usuarioId;
  next();
}

// Aplica a todas as rotas do carrinho
router.use(exigirUsuarioId);

// GET: /api/carrinho - ver carrinho do usuário
router.get('/', asyncHandler(async (req, res) => {
  res.json(carrinhoService.obterOuCriar(req.usuarioId));
}));

// GET: /api/carrinho/itens - listar itens com detalhes
router.get('/itens', asyncHandler(async (req, res) => {
  res.json(carrinhoService.listarItens(req.usuarioId));
}));

// POST: /api/carrinho/itens - adicionar item
router.post('/itens', validate(schemas.adicionar), asyncHandler(async (req, res) => {
  const { idProduto, quantidade } = req.body;
  res.json(carrinhoService.adicionarItem(req.usuarioId, idProduto, quantidade));
}));

// PUT: /api/carrinho/itens/:idProduto - atualizar quantidade
router.put('/itens/:idProduto', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const idProduto = parseInt(req.params.idProduto, 10);
  const { quantidade } = req.body;
  res.json(carrinhoService.atualizarItem(req.usuarioId, idProduto, quantidade));
}));

// DELETE: /api/carrinho/itens/:idProduto - remover item
router.delete('/itens/:idProduto', asyncHandler(async (req, res) => {
  const idProduto = parseInt(req.params.idProduto, 10);
  res.json(carrinhoService.removerItem(req.usuarioId, idProduto));
}));

// DELETE: /api/carrinho - limpar carrinho
router.delete('/', asyncHandler(async (req, res) => {
  res.json(carrinhoService.limpar(req.usuarioId));
}));

export default router;
