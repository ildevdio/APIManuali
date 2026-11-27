import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import productService from '../services/ProductService.js';
import usuarioService from '../services/UsuarioService.js';
import artesaoService from '../services/ArtesaoService.js';
import carrinhoService from '../services/CarrinhoService.js';
import pedidoService from '../services/PedidoService.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-manuali-compat';

const CATEGORIAS = [
  { identificadorCategoria: 'cat-1', nomeCategoria: 'Cerâmica e Barro', slugCategoria: 'ceramica-barro', descricaoCategoria: 'Peças modeladas à mão e queimadas em forno tradicional por mestres ceramistas.' },
  { identificadorCategoria: 'cat-2', nomeCategoria: 'Renda Renascença', slugCategoria: 'renda-renascenca', descricaoCategoria: 'Tecedura minuciosa em lacê e linhas de algodão feitas em agulhas de ponta fina.' },
  { identificadorCategoria: 'cat-3', nomeCategoria: 'Talhas de Madeira', slugCategoria: 'talhas-madeira', descricaoCategoria: 'Esculturas entalhadas em madeira maciça com inspiração na fauna e tradição sertaneja.' },
  { identificadorCategoria: 'cat-4', nomeCategoria: 'Palha & Fibras', slugCategoria: 'palha-fibras', descricaoCategoria: 'Trançados artesanais utilizando fibras nativas do sertão como o ouricuri e carnaúba.' },
  { identificadorCategoria: 'cat-5', nomeCategoria: 'Metal Trabalhado', slugCategoria: 'metal-trabalhado', descricaoCategoria: 'Luminárias e utilitários moldados em metal repuxado e cinzelado à mão.' },
];

const catByNome = new Map(CATEGORIAS.map(c => [c.nomeCategoria.toLowerCase(), c]));

function categoriaFromNome(nome) {
  if (!nome) return CATEGORIAS[0];
  return catByNome.get(String(nome).toLowerCase()) || CATEGORIAS.find(c => c.nomeCategoria.toLowerCase().includes(String(nome).toLowerCase())) || { identificadorCategoria: 'cat-geral', nomeCategoria: nome, slugCategoria: String(nome).toLowerCase().replace(/\s+/g, '-'), descricaoCategoria: '' };
}

function produtoToFrontend(p, artesaoInfo) {
  const cat = categoriaFromNome(p.categoria);
  const precoEmCentavos = Math.round(Number(p.preco) * 100);
  const fotos = Array.isArray(p.fotos) ? p.fotos : [];
  return {
    identificadorProduto: p.id,
    tituloProduto: p.nome,
    identificadorArtesao: p.artesaoId || artesaoInfo?.id || 'artesao-1',
    nomeArtesao: artesaoInfo?.username || artesaoInfo?.nomeCompleto || 'Artesão Manuali',
    nomeAtelie: artesaoInfo?.nomeAtelie || artesaoInfo?.username || 'Ateliê Manuali',
    identificadorCategoria: cat.identificadorCategoria,
    nomeCategoria: cat.nomeCategoria,
    precoEmCentavos,
    estoqueDisponivel: Number(p.estoque ?? 0),
    urlImagem: fotos[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    descricaoCompleta: p.descricao || '',
    estatutoAtivo: p.ativo !== false,
    notaAvaliacaoMedia: 5.0,
    totalAvaliacoes: 0,
    statusPublicacao: p.ativo === false ? 'pausado' : 'ativo',
    historiaPeca: p.historia || '',
    urlImagensGaleria: fotos.length ? fotos : undefined,
  };
}

function produtoToManualiFront(p) {
  const fotos = Array.isArray(p.fotos) ? p.fotos : [];
  return {
    id: p.id,
    nome: p.nome,
    preco: Number(p.preco),
    estoque: Number(p.estoque ?? 0),
    ativo: p.ativo !== false,
    categoria: p.categoria || '',
    fotos,
    descricao: p.descricao || '',
    historia: p.historia || '',
    artesaoId: p.artesaoId,
    mediaAvaliacoes: 5,
    totalAvaliacoes: 0,
  };
}

function produtoToManualiFrontDestaque(p) {
  const fotos = Array.isArray(p.fotos) ? p.fotos : [];
  return {
    id: p.id,
    nome: p.nome,
    preco: Number(p.preco),
    imagem: fotos[0] || '',
    categoria: p.categoria || '',
    estoque: Number(p.estoque ?? 0),
    mediaAvaliacoes: 5,
    totalAvaliacoes: 0,
    artesaoId: p.artesaoId,
  };
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function authFromReq(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), JWT_SECRET); } catch { return null; }
}

function perfilFromUser(user, papel, extras = {}) {
  return {
    identificadorUsuario: user.id,
    nomeCompleto: user.username || user.nomeCompleto || 'Usuário',
    enderecoEmail: user.email,
    papelUsuario: papel,
    identificadorArtesao: extras.identificadorArtesao,
    nomeAtelie: extras.nomeAtelie,
    documentoCpfCnpj: extras.documentoCpfCnpj,
    biografiaAtelie: extras.biografiaAtelie,
    statusCuradoria: extras.statusCuradoria || 'aprovado',
    tokenAcessoJwt: extras.token || '',
  };
}

async function resolverArtesaoInfo(artesaoId) {
  if (!artesaoId) return null;
  try {
    const a = artesaoService.buscarPorId(artesaoId);
    return { id: a.id, username: a.username, nomeAtelie: a.username, documentoCpfCnpj: a.cpf, biografiaAtelie: a.bio };
  } catch { return null; }
}

// ---- Auth ----
router.post('/auth/login', asyncHandler(async (req, res) => {
  const { enderecoEmail, senhaAcesso, papelDesejado } = req.body || {};
  const email = String(enderecoEmail || '').toLowerCase();
  const senha = String(senhaAcesso || '');
  const papel = papelDesejado === 'ARTESAO' ? 'ARTESAO' : papelDesejado === 'ADMIN' ? 'ADMIN' : 'CONSUMIDOR';

  let user = null;
  let extras = {};
  if (papel === 'ARTESAO') {
    const found = artesaoService.listar().find(a => a.email.toLowerCase() === email);
    if (found) {
      const authed = await artesaoService.autenticar(found.username, senha);
      if (authed) { user = authed; extras = { identificadorArtesao: authed.id, nomeAtelie: authed.username, documentoCpfCnpj: authed.cpf, biografiaAtelie: authed.bio }; }
    }
  } else if (papel === 'ADMIN') {
    const adm = await prisma.adm.findFirst({ where: { email } });
    if (adm && senha && await bcrypt.compare(senha, adm.password)) {
      user = { id: adm.idAdm, username: adm.username, email: adm.email };
    }
  } else {
    const found = usuarioService.listar().find(u => u.email.toLowerCase() === email);
    if (found) {
      const authed = await usuarioService.autenticar(found.username, senha);
      if (authed) user = authed;
    }
  }

  if (!user) return res.status(401).json({ erro: 'Credenciais inválidas.' });
  const token = signToken({ sub: user.id, email: user.email, papel, username: user.username, identificadorArtesao: extras.identificadorArtesao });
  return res.json(perfilFromUser(user, papel, { ...extras, token }));
}));

router.post('/auth/register/artesao', validate({
  body: {
    nomeCompleto: { type: 'string', required: true, min: 1 },
    enderecoEmail: { type: 'email', required: true },
    senhaAcesso: { type: 'string', required: true, min: 6 },
    documentoCpfCnpj: { type: 'cpfCnpj', required: true },
  }
}), asyncHandler(async (req, res) => {
  const { nomeCompleto, enderecoEmail, senhaAcesso, documentoCpfCnpj, nomeAtelie, biografiaAtelie } = req.body || {};
  const created = await artesaoService.criar({
    username: nomeAtelie || nomeCompleto,
    password: senhaAcesso,
    email: enderecoEmail,
    cep: '00000-000',
    cpf: documentoCpfCnpj || '00000000000',
    bio: biografiaAtelie,
  });
  const token = signToken({ sub: created.id, email: created.email, papel: 'ARTESAO', username: created.username, identificadorArtesao: created.id });
  return res.status(201).json(perfilFromUser(created, 'ARTESAO', { identificadorArtesao: created.id, nomeAtelie: nomeAtelie || created.username, documentoCpfCnpj: created.cpf, biografiaAtelie: created.bio, token }));
}));

router.post('/auth/register/consumidor', validate({
  body: {
    nomeCompleto: { type: 'string', required: true, min: 1 },
    enderecoEmail: { type: 'email', required: true },
    senhaAcesso: { type: 'string', required: true, min: 6 },
  }
}), asyncHandler(async (req, res) => {
  const { nomeCompleto, enderecoEmail, senhaAcesso } = req.body || {};
  const created = await usuarioService.criar({
    username: nomeCompleto,
    password: senhaAcesso,
    email: enderecoEmail,
    cep: '00000-000',
  });
  const token = signToken({ sub: created.id, email: created.email, papel: 'CONSUMIDOR', username: created.username });
  return res.status(201).json(perfilFromUser(created, 'CONSUMIDOR', { token }));
}));

router.get('/auth/me', asyncHandler(async (req, res) => {
  const auth = authFromReq(req);
  if (!auth) return res.status(401).json({ erro: 'Não autenticado.' });
  const papel = auth.papel || 'CONSUMIDOR';
  let user = null; let extras = {};
  try {
    if (papel === 'ARTESAO') { user = artesaoService.buscarPorId(auth.sub); extras = { identificadorArtesao: user.id, nomeAtelie: user.username, documentoCpfCnpj: user.cpf, biografiaAtelie: user.bio }; }
    else if (papel === 'ADMIN') {
      const adm = await prisma.adm.findUnique({ where: { idAdm: auth.sub } });
      user = adm ? { id: adm.idAdm, username: adm.username, email: adm.email } : { id: auth.sub, username: auth.username || 'Admin', email: auth.email };
    }
    else { user = usuarioService.buscarPorId(auth.sub); }
  } catch { user = { id: auth.sub, username: auth.username || 'Usuário', email: auth.email }; }
  return res.json(perfilFromUser(user, papel, extras));
}));

router.post('/auth/logout', asyncHandler(async (_req, res) => {
  return res.status(204).send();
}));

// ---- Categorias ----
router.get('/categorias', asyncHandler(async (_req, res) => {
  res.json(CATEGORIAS);
}));

// ---- Recomendações (ManualiFront) ----
router.get('/recomendacoes/destaque', asyncHandler(async (req, res) => {
  const limite = Math.max(1, Math.min(50, Number(req.query.limite) || 8));
  let produtos = await productService.listar();
  produtos = produtos.filter(p => p.ativo !== false).slice(0, limite);
  res.json({ data: produtos.map(p => ({ produto: produtoToManualiFrontDestaque(p) })) });
}));

// ---- Produtos ----
router.get('/produtos', asyncHandler(async (req, res) => {
  const { categoria, busca, artesaoId, incluirInativos } = req.query;
  let produtos = await productService.listar();
  if (!incluirInativos || incluirInativos === 'false') produtos = produtos.filter(p => p.ativo !== false);
  if (categoria && categoria !== 'todos') {
    const cat = CATEGORIAS.find(c => c.identificadorCategoria === categoria);
    if (cat) produtos = produtos.filter(p => (p.categoria || '').toLowerCase() === cat.nomeCategoria.toLowerCase());
  }
  if (busca) {
    const b = String(busca).toLowerCase();
    produtos = produtos.filter(p => [p.nome, p.descricao, p.categoria].filter(Boolean).some(v => String(v).toLowerCase().includes(b)));
  }
  if (artesaoId) produtos = produtos.filter(p => p.artesaoId === artesaoId);
  const enriched = await Promise.all(produtos.map(async p => produtoToFrontend(p, await resolverArtesaoInfo(p.artesaoId))));
  res.json(enriched);
}));

router.get('/produtos/:id/recomendacoes', asyncHandler(async (req, res) => {
  const limite = Math.max(1, Math.min(50, Number(req.query.limite) || 4));
  const atual = await productService.buscarPorId(req.params.id).catch(() => null);
  let produtos = await productService.listar();
  produtos = produtos.filter(p => p.ativo !== false && (!atual || p.id !== atual.id));
  if (atual?.categoria) {
    const mesmaCat = produtos.filter(p => p.categoria === atual.categoria);
    const outras = produtos.filter(p => p.categoria !== atual.categoria);
    produtos = [...mesmaCat, ...outras];
  }
  produtos = produtos.slice(0, limite);
  res.json({ data: produtos.map(p => ({ produto: produtoToManualiFrontDestaque(p) })) });
}));

router.get('/produtos/:id', asyncHandler(async (req, res) => {
  const p = await productService.buscarPorId(req.params.id);
  const artesaoInfo = await resolverArtesaoInfo(p.artesaoId);
  const origem = produtoToFrontend(p, artesaoInfo);
  const manuali = produtoToManualiFront(p);
  res.json({ data: manuali, ...origem });
}));

router.post('/produtos', asyncHandler(async (req, res) => {
  const auth = authFromReq(req);
  const body = req.body || {};
  const cat = CATEGORIAS.find(c => c.identificadorCategoria === body.identificadorCategoria);
  const fotos = body.urlImagensGaleria?.length ? body.urlImagensGaleria
    : body.fotos?.length ? body.fotos
    : body.urlImagem ? [body.urlImagem]
    : body.imagem ? [body.imagem]
    : body.url ? [body.url]
    : [];
  const created = await productService.criar({
    nome: body.tituloProduto || body.nome,
    descricao: body.descricaoCompleta ?? body.descricao,
    preco: body.precoEmCentavos != null ? (Number(body.precoEmCentavos) / 100) : Number(body.preco || 0),
    estoque: Number(body.estoqueDisponivel ?? body.estoque ?? 0),
    ativo: (body.statusPublicacao ?? (body.ativo === false ? 'pausado' : 'ativo')) === 'ativo',
    categoria: cat?.nomeCategoria || body.categoria || 'Cerâmica e Barro',
    fotos,
    historia: body.historiaPeca ?? body.historia,
    artesaoId: auth?.identificadorArtesao || auth?.sub || body.identificadorArtesao || body.artesaoId,
  });
  res.status(201).json(produtoToFrontend(created, await resolverArtesaoInfo(created.artesaoId)));
}));

router.put('/produtos/:id', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const cat = CATEGORIAS.find(c => c.identificadorCategoria === body.identificadorCategoria);
  const current = await productService.buscarPorId(req.params.id);
  const fotos = body.urlImagensGaleria?.length ? body.urlImagensGaleria
    : body.fotos?.length ? body.fotos
    : body.urlImagem ? [body.urlImagem]
    : body.imagem ? [body.imagem]
    : body.url ? [body.url]
    : current.fotos;
  const updated = await productService.atualizar(req.params.id, {
    nome: body.tituloProduto ?? body.nome ?? current.nome,
    descricao: body.descricaoCompleta ?? body.descricao ?? current.descricao,
    preco: body.precoEmCentavos != null ? (Number(body.precoEmCentavos) / 100) : (body.preco != null ? Number(body.preco) : current.preco),
    estoque: body.estoqueDisponivel != null ? Number(body.estoqueDisponivel) : (body.estoque != null ? Number(body.estoque) : current.estoque),
    ativo: body.statusPublicacao ? body.statusPublicacao === 'ativo' : (body.ativo != null ? !!body.ativo : current.ativo),
    categoria: cat?.nomeCategoria || body.categoria || current.categoria,
    fotos,
    historia: body.historiaPeca ?? body.historia ?? current.historia,
    artesaoId: body.artesaoId || current.artesaoId,
  });
  res.json(produtoToFrontend(updated, await resolverArtesaoInfo(updated.artesaoId)));
}));

router.patch('/produtos/:id/estoque', asyncHandler(async (req, res) => {
  const current = await productService.buscarPorId(req.params.id);
  const updated = await productService.atualizar(req.params.id, { ...current, estoque: Number(req.body?.estoqueDisponivel ?? current.estoque) });
  res.json(produtoToFrontend(updated, await resolverArtesaoInfo(updated.artesaoId)));
}));

router.delete('/produtos/:id', asyncHandler(async (req, res) => {
  await productService.deletar(req.params.id);
  res.status(204).send();
}));

// ---- Carrinho ----
async function montarCarrinhoFrontend(usuarioId) {
  const { itens, total } = await carrinhoService.listarItens(usuarioId);
  const itensCarrinho = await Promise.all((itens || []).filter(i => !i.produtoNaoEncontrado).map(async (i) => {
    let produto;
    try { produto = produtoToFrontend(await productService.buscarPorId(i.idProduto), await resolverArtesaoInfo((await productService.buscarPorId(i.idProduto)).artesaoId)); } catch {
      produto = { identificadorProduto: i.idProduto, tituloProduto: i.nome || 'Produto', identificadorArtesao: '', nomeArtesao: '', nomeAtelie: '', identificadorCategoria: 'cat-1', nomeCategoria: '', precoEmCentavos: Math.round(Number(i.preco||0)*100), estoqueDisponivel: 0, urlImagem: i.imagem || '', descricaoCompleta: '', estatutoAtivo: true, notaAvaliacaoMedia: 5, totalAvaliacoes: 0 };
    }
    const quantidadeSolicitada = Number(i.quantidade || 0);
    const subtotalEmCentavos = Math.round(Number(i.subtotal ?? (produto.precoEmCentavos/100)*quantidadeSolicitada) * 100) / 100;
    return {
      identificadorItemCarrinho: `${usuarioId}:${i.idProduto}`,
      produtoItem: produto,
      quantidadeSolicitada,
      subtotalEmCentavos: Math.round(Number(i.subtotal ?? 0) * 100),
    };
  }));
  const valorTotalEmCentavos = itensCarrinho.reduce((a, i) => a + i.subtotalEmCentavos, 0);
  const quantidadeTotalItens = itensCarrinho.reduce((a, i) => a + i.quantidadeSolicitada, 0);
  return { itensCarrinho, valorTotalEmCentavos, quantidadeTotalItens };
}

function reqUsuarioId(req) {
  const auth = authFromReq(req);
  return auth?.sub || req.header('x-usuario-id') || req.query.usuarioId || 'anon';
}

router.get('/carrinho', asyncHandler(async (req, res) => {
  res.json(await montarCarrinhoFrontend(reqUsuarioId(req)));
}));

router.post('/carrinho/itens', asyncHandler(async (req, res) => {
  const usuarioId = reqUsuarioId(req);
  const { identificadorProduto, quantidade } = req.body || {};
  await carrinhoService.adicionarItem(usuarioId, identificadorProduto, Number(quantidade || 1));
  res.json(await montarCarrinhoFrontend(usuarioId));
}));

router.patch('/carrinho/itens/:itemId', asyncHandler(async (req, res) => {
  const usuarioId = reqUsuarioId(req);
  const itemId = String(req.params.itemId);
  const idProduto = itemId.includes(':') ? itemId.split(':').slice(1).join(':') : itemId;
  const quantidade = Number(req.body?.quantidade ?? 0);
  if (quantidade <= 0) await carrinhoService.removerItem(usuarioId, idProduto);
  else await carrinhoService.atualizarItem(usuarioId, idProduto, quantidade);
  res.json(await montarCarrinhoFrontend(usuarioId));
}));

router.delete('/carrinho/itens/:itemId', asyncHandler(async (req, res) => {
  const usuarioId = reqUsuarioId(req);
  const itemId = String(req.params.itemId);
  const idProduto = itemId.includes(':') ? itemId.split(':').slice(1).join(':') : itemId;
  await carrinhoService.removerItem(usuarioId, idProduto);
  res.json(await montarCarrinhoFrontend(usuarioId));
}));

// ---- Pedidos ----
function pedidoToFrontend(p) {
  const itensPedido = (p.itens || []).map(i => ({
    identificadorProduto: i.idProduto,
    tituloProduto: i.nome || 'Produto',
    quantidadeComprada: Number(i.quantidade || 0),
    precoUnitarioEmCentavos: Math.round(Number(i.precoUnitario || 0) * 100),
    urlImagem: i.imagem || '',
  }));
  const statusMap = { pendente: 'aguardando_pagamento', aprovado: 'pago', preparado: 'preparando', enviado: 'enviado', entregue: 'entregue', cancelado: 'cancelado' };
  return {
    identificadorPedido: p.idPedido || p.id,
    identificadorComprador: p.usuarioId,
    nomeComprador: p.nomeComprador || 'Comprador',
    identificadorArtesao: p.artesaoId || '',
    nomeAtelie: p.nomeAtelie || 'Ateliê',
    itensPedido,
    valorTotalEmCentavos: Math.round(Number(p.total || 0) * 100),
    statusPedido: statusMap[p.status] || p.status || 'aguardando_pagamento',
    statusPagamento: p.status === 'pendente' ? 'pendente' : p.status === 'cancelado' ? 'recusado' : 'aprovado',
    metodoPagamento: 'pix',
    statusEntrega: p.status === 'entregue' ? 'entregue' : p.status === 'enviado' ? 'em_transito' : 'aguardando_envio',
    dataCriacaoIso: p.data ? new Date(p.data).toISOString() : new Date().toISOString(),
  };
}

router.post('/checkout', asyncHandler(async (req, res) => {
  const usuarioId = reqUsuarioId(req);
  const carrinho = await carrinhoService.listarItens(usuarioId);
  if (!carrinho.itens?.length) return res.status(400).json({ erro: 'Carrinho vazio.' });
  const itens = carrinho.itens.filter(i => !i.produtoNaoEncontrado).map(i => ({ idProduto: i.idProduto, quantidade: i.quantidade }));
  const pedido = await pedidoService.criar({ itens, cep: '00000-000', usuarioId, endereco: 'Endereço não informado' });
  try { await carrinhoService.limpar(usuarioId); } catch {}
  const dto = pedidoToFrontend(pedido.toGetDto ? pedido.toGetDto() : pedido);
  // enrich names
  dto.nomeComprador = req.body?.nomeComprador || 'Comprador';
  res.status(201).json(dto);
}));

router.get('/pedidos/artesao/:artesaoId', asyncHandler(async (req, res) => {
  const pedidos = pedidoService.listar({});
  res.json(pedidos.map(pedidoToFrontend));
}));

router.patch('/pedidos/:id/status', asyncHandler(async (req, res) => {
  const reverse = { aguardando_pagamento: 'pendente', pago: 'aprovado', preparando: 'preparado', enviado: 'enviado', entregue: 'entregue', cancelado: 'cancelado' };
  const status = reverse[req.body?.statusPedido] || req.body?.statusPedido;
  const pedido = pedidoService.atualizarStatus(req.params.id, status);
  res.json(pedidoToFrontend(pedido));
}));

export default router;
