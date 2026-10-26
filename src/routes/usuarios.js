import express from 'express';
import usuarioService from '../services/UsuarioService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET: /api/usuarios
router.get('/', asyncHandler(async (req, res) => {
  const usuarios = usuarioService.listar();
  res.json(usuarios);
}));

// GET: /api/usuarios/search?username=ana
router.get('/search', asyncHandler(async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ erro: 'Parâmetro username é obrigatório.' });
  }
  const usuario = usuarioService.buscarPorUsername(username);
  res.json(usuario);
}));

// GET: /api/usuarios/5
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const usuario = usuarioService.buscarPorId(id);
  res.json(usuario);
}));

// POST: /api/usuarios
router.post('/', asyncHandler(async (req, res) => {
  const dto = req.body;
  if (!dto || !dto.username || !dto.password || !dto.email || !dto.cep) {
    return res.status(400).json({ erro: 'Campos obrigatórios: username, password, email, cep.' });
  }
  const usuario = await usuarioService.criar(dto);
  res.status(201).location(`/api/usuarios/${usuario.id}`).json(usuario);
}));

// PUT: /api/usuarios/5
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const dto = req.body;
  if (!dto || !dto.username || !dto.email || !dto.cep) {
    return res.status(400).json({ erro: 'Campos obrigatórios: username, email, cep.' });
  }
  const usuario = await usuarioService.atualizar(id, dto);
  res.json(usuario);
}));

// DELETE: /api/usuarios/5
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  usuarioService.deletar(id);
  res.status(204).send();
}));

export default router;