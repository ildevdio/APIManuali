import express from 'express';
import artesaoService from '../services/ArtesaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// GET: /api/artesaos
router.get('/', asyncHandler(async (req, res) => {
  const artesaos = artesaoService.listar();
  res.json(artesaos);
}));

// GET: /api/artesaos/search?username=maria
router.get('/search', asyncHandler(async (req, res) => {
  const { username } = req.query;
  const artesao = artesaoService.buscarPorUsername(username);
  res.json(artesao);
}));

// GET: /api/artesaos/5
router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const artesao = artesaoService.buscarPorId(id);
  res.json(artesao);
}));

// POST: /api/artesaos
router.post('/', asyncHandler(async (req, res) => {
  const artesao = await artesaoService.criar(req.body);
  res.status(201).location(`/api/artesaos/${artesao.id}`).json(artesao);
}));

// PUT: /api/artesaos/5
router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const artesao = await artesaoService.atualizar(id, req.body);
  res.json(artesao);
}));

// DELETE: /api/artesaos/5
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  await artesaoService.deletar(id);
  res.status(204).send();
}));

export default router;