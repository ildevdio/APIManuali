import express from 'express';
import usuarioService from '../services/UsuarioService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
  listar: {},
  buscarPorUsername: {
    query: {
      username: { type: 'string', required: true, min: 1, max: 100 }
    }
  },
  buscarPorId: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  },
  criar: {
    body: {
      username: { type: 'string', required: true, min: 3, max: 50 },
      password: { type: 'string', required: true, min: 6 },
      email: { type: 'email', required: true },
      cep: { type: 'cep', required: true }
    }
  },
  atualizar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    },
    body: {
      username: { type: 'string', required: true, min: 3, max: 50 },
      email: { type: 'email', required: true },
      cep: { type: 'cep', required: true },
      password: { type: 'string', min: 6 }
    }
  },
  deletar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  }
};

// GET: /api/usuarios
router.get('/', asyncHandler(async (req, res) => {
  const usuarios = usuarioService.listar();
  res.json(usuarios);
}));

// GET: /api/usuarios/search?username=ana
router.get('/search', validate(schemas.buscarPorUsername), asyncHandler(async (req, res) => {
  const { username } = req.query;
  const usuario = usuarioService.buscarPorUsername(username);
  res.json(usuario);
}));

// GET: /api/usuarios/5
router.get('/:id', validate(schemas.buscarPorId), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const usuario = usuarioService.buscarPorId(id);
  res.json(usuario);
}));

// POST: /api/usuarios
router.post('/', validate(schemas.criar), asyncHandler(async (req, res) => {
  const dto = req.body;
  const usuario = await usuarioService.criar(dto);
  res.status(201).location(`/api/usuarios/${usuario.id}`).json(usuario);
}));

// PUT: /api/usuarios/5
router.put('/:id', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dto = req.body;
  const usuario = await usuarioService.atualizar(id, dto);
  res.json(usuario);
}));

// DELETE: /api/usuarios/5
router.delete('/:id', validate(schemas.deletar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  usuarioService.deletar(id);
  res.status(204).send();
}));

export default router;
