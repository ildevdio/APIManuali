import express from 'express';
import productService from '../services/ProductService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const schemas = {
  listar: {
    query: {
      categoria: { type: 'string', required: false, max: 100 },
      ativo: { type: 'boolean', required: false }
    }
  },
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
      ativo: { type: 'boolean', required: false },
      categoria: { type: 'string', required: false, max: 100 },
      fotos: { type: 'array', required: false },
      historia: { type: 'string', required: false, max: 2000 },
      artesaoId: { type: 'positiveInteger', required: false }
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
      ativo: { type: 'boolean', required: true },
      categoria: { type: 'string', required: false, max: 100 },
      fotos: { type: 'array', required: false },
      historia: { type: 'string', required: false, max: 2000 },
      artesaoId: { type: 'positiveInteger', required: false }
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
  const { categoria, ativo } = req.query;
  let produtos = productService.listar();

  if (categoria) {
    produtos = produtos.filter(p => p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase());
  }

  if (ativo !== undefined) {
    const ativoBool = ativo === 'true';
    produtos = produtos.filter(p => p.ativo === ativoBool);
  }

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
  const produto = productService.criar({
    nome: dto.nome,
    descricao: dto.descricao,
    preco: dto.preco,
    estoque: dto.estoque,
    ativo: dto.ativo,
    categoria: dto.categoria,
    fotos: dto.fotos,
    historia: dto.historia,
    artesaoId: dto.artesaoId
  });
  res.status(201).location(`/api/products/${produto.id}`).json(produto);
}));

// PUT: /api/products/5
router.put('/:id', validate(schemas.atualizar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dto = req.body;
  const produto = await productService.atualizar(id, {
    nome: dto.nome,
    descricao: dto.descricao,
    preco: dto.preco,
    estoque: dto.estoque,
    ativo: dto.ativo,
    categoria: dto.categoria,
    fotos: dto.fotos,
    historia: dto.historia,
    artesaoId: dto.artesaoId
  });
  res.json(produto);
}));

// DELETE: /api/products/5
router.delete('/:id', validate(schemas.deletar), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await productService.deletar(id);
  res.status(204).send();
}));

export default router;
