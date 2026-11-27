import express from 'express';
import recomendacaoService from '../services/RecomendacaoService.js';
import iaRecomendacaoService from '../services/IARecomendacaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

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

// GET: /api/recomendacoes/ia/produto/:id?limite=4
router.get('/ia/produto/:id', asyncHandler(async (req, res) => {
  const limite = req.query.limite ? parseInt(req.query.limite, 10) : 4;
  const resultado = await iaRecomendacaoService.recomendarPorProduto(req.params.id, limite);
  res.json(resultado);
}));

// POST: /api/recomendacoes/ia/busca
router.post('/ia/busca', validate({
  body: {
    consulta: { type: 'string', required: true, min: 1 },
    limite: { type: 'positiveInteger', required: false },
  }
}), asyncHandler(async (req, res) => {
  const { consulta, limite } = req.body || {};
  const resultado = await iaRecomendacaoService.buscarPorTexto(consulta, limite || 4);
  res.json(resultado);
}));

export default router;
