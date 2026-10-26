import express from 'express';
import admService from '../services/AdmService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET: /api/adms
router.get('/', asyncHandler(async (req, res) => {
  const adms = admService.listar();
  res.json(adms);
}));

// GET: /api/adms/search?username=joao
router.get('/search', asyncHandler(async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ erro: 'Parâmetro username é obrigatório.' });
  }
  const adm = admService.buscarPorUsername(username);
  res.json(adm);
}));

// GET: /api/adms/5
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const adm = admService.buscarPorId(id);
  res.json(adm);
}));

// POST: /api/adms
router.post('/', asyncHandler(async (req, res) => {
  const dto = req.body;
  if (!dto || !dto.username || !dto.password || !dto.email) {
    return res.status(400).json({ erro: 'Campos obrigatórios: username, password, email.' });
  }
  const adm = await admService.criar(dto);
  res.status(201).location(`/api/adms/${adm.idAdm}`).json(adm);
}));

// PUT: /api/adms/5
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const dto = req.body;
  if (!dto || !dto.username || !dto.email) {
    return res.status(400).json({ erro: 'Campos obrigatórios: username, email.' });
  }
  const adm = await admService.atualizar(id, dto);
  res.json(adm);
}));

// DELETE: /api/adms/5
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  admService.deletar(id);
  res.status(204).send();
}));

export default router;