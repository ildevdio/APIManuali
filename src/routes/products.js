import express from 'express';
import productService from '../services/ProductService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET: /api/products
router.get('/', asyncHandler(async (req, res) => {
  const produtos = productService.listar();
  res.json(produtos);
}));

// GET: /api/products/search?nome=caneca
router.get('/search', asyncHandler(async (req, res) => {
  const { nome } = req.query;
  const produtos = productService.buscarPorNome(nome);
  res.json(produtos);
}));

// GET: /api/products/5
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const produto = productService.buscarPorId(id);
  res.json(produto);
}));

// POST: /api/products
router.post('/', asyncHandler(async (req, res) => {
  const dto = req.body;
  if (!dto || !dto.nome || dto.preco === undefined || dto.estoque === undefined) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, preco, estoque.' });
  }
  const produto = productService.criar(dto);
  res.status(201).location(`/api/products/${produto.id}`).json(produto);
}));

// PUT: /api/products/5
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  const dto = req.body;
  if (!dto || dto.nome === undefined || dto.preco === undefined || dto.estoque === undefined || dto.ativo === undefined) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, preco, estoque, ativo.' });
  }
  const produto = await productService.atualizar(id, dto);
  res.json(produto);
}));

// DELETE: /api/products/5
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido.' });
  }
  await productService.deletar(id);
  res.status(204).send();
}));

export default router;