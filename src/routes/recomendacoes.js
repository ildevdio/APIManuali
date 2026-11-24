import express from 'express';
import recomendacaoService from '../services/RecomendacaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET: /api/recomendacoes/relacionados/:id
router.get('/relacionados/:id', asyncHandler(async (req, res) => {
  const produtoId = req.params.id;
  const limite = req.query.limite ? parseInt(req.query.limite, 10) : 4;
  const relacionados = await recomendacaoService.produtosRelacionados(produtoId, limite);
  res.json(relacionados);
}));

// GET: /api/recomendacoes/mais-avaliados
router.get('/mais-avaliados', asyncHandler(async (req, res) => {
  const limite = req.query.limite ? parseInt(req.query.limite, 10) : 5;
  const maisAvaliados = await recomendacaoService.maisAvaliados(limite);
  res.json(maisAvaliados);
}));

// GET: /api/recomendacoes/destaque
router.get('/destaque', asyncHandler(async (req, res) => {
  const limite = req.query.limite ? parseInt(req.query.limite, 10) : 8;
  const destaque = await recomendacaoService.emDestaque(limite);
  res.json(destaque);
}));

export default router;
