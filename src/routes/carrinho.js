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

// Middleware: valida o usuarioId e converte para número (antes repetido em todas as rotas)
function exigirUsuarioId(req, res, next) {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  req.usuarioId = parseInt(usuarioId, 10);
  next();
}

router.use(exigirUsuarioId);

// GET: /api/carrinho - ver carrinho do usuário (usuárioId via query ou body)
router.get('/', asyncHandler(async (req, res) => {
  const carrinho = carrinhoService.obterOuCriar(req.usuarioId);
  res.json(carrinho);
}));

// GET: /api/carrinho/itens - listar itens com detalhes
router.get('/itens', asyncHandler(async (req, res) => {
  const resultado = carrinhoService.listarItens(req.usuarioId);
  res.json(resultado);
}));

// POST: /api/carrinho/itens - adicionar item
router.post('/itens', validate(schemas.adicionar), asyncHandler(async (req, res) => {
  const { idProduto, quantidade } = req.body;
  const carrinho = carrinhoService.adicionarItem(req.usuarioId, idProduto, quantidade);
  res.json(carrinho);
}));

// PUT: /api/carrinho/itens/:idProduto - atualizar quantidade
router.put('/itens/:idProduto', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const idProduto = parseInt(req.params.idProduto, 10);
  const { quantidade } = req.body;
  const carrinho = carrinhoService.atualizarItem(req.usuarioId, idProduto, quantidade);
  res.json(carrinho);
}));

// DELETE: /api/carrinho/itens/:idProduto - remover item
router.delete('/itens/:idProduto', asyncHandler(async (req, res) => {
  const idProduto = parseInt(req.params.idProduto, 10);
  const carrinho = carrinhoService.removerItem(req.usuarioId, idProduto);
  res.json(carrinho);
}));

// DELETE: /api/carrinho - limpar carrinho
router.delete('/', asyncHandler(async (req, res) => {
  const carrinho = carrinhoService.limpar(req.usuarioId);
  res.json(carrinho);
}));

export default router;
