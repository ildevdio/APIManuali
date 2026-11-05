import express from 'express';
import avaliacaoService from '../services/AvaliacaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
  criar: {
    body: {
      produtoId: { type: 'positiveInteger', required: true },
      nota: { type: 'positiveInteger', required: true },
      comentario: { type: 'string', required: false, max: 500 }
    }
  }
};

// POST: /api/avaliacoes
router.post('/', validate(schemas.criar), asyncHandler(async (req, res) => {
  const { produtoId, nota, comentario } = req.body;
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const avaliacao = avaliacaoService.criar(produtoId, parseInt(usuarioId, 10), nota, comentario);
  res.status(201).json(avaliacao);
}));

// GET: /api/avaliacoes/produto/:id
router.get('/produto/:id', asyncHandler(async (req, res) => {
  const produtoId = parseInt(req.params.id, 10);
  const avaliacoes = avaliacaoService.listarPorProduto(produtoId);
  res.json(avaliacoes);
}));

// GET: /api/avaliacoes/media/:id
router.get('/media/:id', asyncHandler(async (req, res) => {
  const produtoId = parseInt(req.params.id, 10);
  const stats = avaliacaoService.mediaPorProduto(produtoId);
  res.json(stats);
}));

// GET: /api/avaliacoes/usuario
router.get('/usuario', asyncHandler(async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  const avaliacoes = avaliacaoService.listarPorUsuario(parseInt(usuarioId, 10));
  res.json(avaliacoes);
}));

// DELETE: /api/avaliacoes/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  avaliacaoService.deletar(id);
  res.status(204).send();
}));

export default router;
