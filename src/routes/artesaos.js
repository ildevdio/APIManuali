import express from 'express';
import artesaoService from '../services/ArtesaoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
  criar: {
    body: {
      username: { type: 'string', required: true, min: 3, max: 50 },
      password: { type: 'string', required: true, min: 6 },
      email: { type: 'email', required: true },
      cep: { type: 'cep', required: true },
      cpf: { type: 'cpf', required: true }
    }
  },
  buscarPorUsername: {
    query: {
      username: { type: 'string', required: true, min: 1, max: 100 }
    }
  },
  buscarPorId: {
    params: {
      id: { type: 'uuid', required: true }
    }
  },
  atualizar: {
    params: {
      id: { type: 'uuid', required: true }
    },
    body: {
      username: { type: 'string', required: true, min: 3, max: 50 },
      email: { type: 'email', required: true },
      cep: { type: 'cep', required: true },
      cpf: { type: 'cpf', required: true }
    }
  },
  deletar: {
    params: {
      id: { type: 'uuid', required: true }
    }
  }
};

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
router.post('/', validate(schemas.criar), asyncHandler(async (req, res) => {
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