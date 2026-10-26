import express from 'express';
import artesaoService from '../services/ArtesaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET: /api/artesaos
router.get('/', asyncHandler(async (req, res) => {
  const artesaos = artesaoService.listar();
  res.json(artesaos);
}));

// GET: /api/artesaos/search?username=maria
router.get('/search', asyncHandler(async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ erro: 'Parâmetro username é obrigatório.' });
  }
  const artesao = artesaoService.buscarPorUsername(username);
  res.json(artesao);
}));

// GET: /api/artesaos/5
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const artesao = artesaoService.buscarPorId(id);
  res.json(artesao);
}));

// POST: /api/artesaos
router.post('/', asyncHandler(async (req, res) => {
  const dto = req.body;
  if (!dto || !dto.username || !dto.password || !dto.email || !dto.cep || !dto.cpf) {
    return res.status(400).json({ erro: 'Campos obrigatórios: username, password, email, cep, cpf.' });
  }
  const artesao = await artesaoService.criar(dto);
  res.status(201).location(`/api/artesaos/${artesao.id}`).json(artesao);
}));

// PUT: /api/artesaos/5
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const dto = req.body;
  if (!dto || !dto.username || !dto.email || !dto.cep || !dto.cpf) {
    return res.status(400).json({ erro: 'Campos obrigatórios: username, email, cep, cpf.' });
  }
  const artesao = await artesaoService.atualizar(id, dto);
  res.json(artesao);
}));

// DELETE: /api/artesaos/5
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  artesaoService.deletar(id);
  res.status(204).send();
}));

export default router;