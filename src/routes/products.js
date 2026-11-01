import express from 'express';
import productService from '../services/ProductService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
  buscarPorNome: {
    query: {
      nome: { type: 'string', required: false, max: 100 }
    }
  },
  buscarPorId: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  },
  criar: {
    body: {
      nome: { type: 'string', required: true, min: 1, max: 100 },
      descricao: { type: 'string', required: false, max: 500 },
      preco: { type: 'positiveNumber', required: true },
      estoque: { type: 'nonNegativeInteger', required: true },
      ativo: { type: 'boolean', required: false }
    }
  },
  atualizar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    },
    body: {
      nome: { type: 'string', required: true, min: 1, max: 100 },
      descricao: { type: 'string', required: false, max: 500 },
      preco: { type: 'positiveNumber', required: true },
      estoque: { type: 'nonNegativeInteger', required: true },
      ativo: { type: 'boolean', required: true }
    }
  },
  deletar: {
    params: {
      id: { type: 'positiveInteger', required: true }
    }
  }
};

// GET: /api/products
router.get('/', asyncHandler(async (req, res) => {
  const produtos = productService.listar();
  res.json(produtos);
}));

// GET: /api/products/search?nome=caneca
router.get('/search', validate(schemas.buscarPorNome), asyncHandler(async (req, res) => {
  const { nome } = req.query;
  const produtos = productService.buscarPorNome(nome);
  res.json(produtos);
}));

// GET: /api/products/5
router.get('/:id', validate(schemas.buscarPorId), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const produto = productService.buscarPorId(id);
  res.json(produto);
}));

// POST: /api/products
router.post('/', validate(schemas.criar), asyncHandler(async (req, res) => {
  const dto = req.body;
  const produto = productService.criar(dto);
  res.status(201).location(`/api/products/${produto.id}`).json(produto);
}));

// PUT: /api/products/5
router.put('/:id', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dto = req.body;
  const produto = await productService.atualizar(id, dto);
  res.json(produto);
}));

// DELETE: /api/products/5
router.delete('/:id', validate(schemas.deletar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await productService.deletar(id);
  res.status(204).send();
}));

export default router;
