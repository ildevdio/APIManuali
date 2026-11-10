import express from 'express';
import admService from '../services/AdmService.js';
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
      email: { type: 'email', required: true }
    }
  },
  atualizar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    },
    body: {
      username: { type: 'string', required: true, min: 3, max: 50 },
      email: { type: 'email', required: true },
      password: { type: 'string', min: 6 }
    }
  },
  deletar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  }
};

// GET: /api/adms
router.get('/', asyncHandler(async (req, res) => {
  const adms = admService.listar();
  res.json(adms);
}));

// GET: /api/adms/search?username=joao
router.get('/search', validate(schemas.buscarPorUsername), asyncHandler(async (req, res) => {
  const { username } = req.query;
  const adm = admService.buscarPorUsername(username);
  res.json(adm);
}));

// GET: /api/adms/5
router.get('/:id', validate(schemas.buscarPorId), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const adm = admService.buscarPorId(id);
  res.json(adm);
}));

// POST: /api/adms
router.post('/', validate(schemas.criar), asyncHandler(async (req, res) => {
  const adm = await admService.criar(req.body);
  res.status(201).location(`/api/adms/${adm.idAdm}`).json(adm);
}));

// PUT: /api/adms/5
router.put('/:id', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const adm = await admService.atualizar(id, req.body);
  res.json(adm);
}));

// DELETE: /api/adms/5
router.delete('/:id', validate(schemas.deletar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await admService.deletar(id);
  res.status(204).send();
}));

export default router;
