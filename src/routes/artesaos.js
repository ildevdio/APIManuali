import express from 'express';
import artesaoService from '../services/ArtesaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
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
      cep: { type: 'cep', required: true },
      cpf: { type: 'cpf', required: true },
      bio: { type: 'string', required: false, max: 1000 },
      experiencia: { type: 'string', required: false, max: 1000 },
      telefone: { type: 'string', required: false, max: 20 }
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
      cpf: { type: 'cpf', required: true },
      bio: { type: 'string', required: false, max: 1000 },
      experiencia: { type: 'string', required: false, max: 1000 },
      telefone: { type: 'string', required: false, max: 20 },
      password: { type: 'string', min: 6 }
    }
  },
  deletar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  }
};

// GET: /api/artesaos
router.get('/', asyncHandler(async (req, res) => {
  const artesaos = artesaoService.listar();
  res.json(artesaos);
}));

// GET: /api/artesaos/search?username=maria
router.get('/search', validate(schemas.buscarPorUsername), asyncHandler(async (req, res) => {
  const { username } = req.query;
  const artesao = artesaoService.buscarPorUsername(username);
  res.json(artesao);
}));

// GET: /api/artesaos/5
router.get('/:id', validate(schemas.buscarPorId), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const artesao = artesaoService.buscarPorId(id);
  res.json(artesao);
}));

// POST: /api/artesaos
router.post('/', validate(schemas.criar), asyncHandler(async (req, res) => {
  const artesao = await artesaoService.criar({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    cep: req.body.cep,
    cpf: req.body.cpf,
    bio: req.body.bio,
    experiencia: req.body.experiencia,
    telefone: req.body.telefone
  });
  res.status(201).location(`/api/artesaos/${artesao.id}`).json(artesao);
}));

// PUT: /api/artesaos/5
router.put('/:id', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const artesao = await artesaoService.atualizar(id, {
    username: req.body.username,
    email: req.body.email,
    cep: req.body.cep,
    cpf: req.body.cpf,
    bio: req.body.bio,
    experiencia: req.body.experiencia,
    telefone: req.body.telefone,
    password: req.body.password
  });
  res.json(artesao);
}));

// DELETE: /api/artesaos/5
router.delete('/:id', validate(schemas.deletar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  artesaoService.deletar(id);
  res.status(204).send();
}));

export default router;
