import fs from 'fs';
import path from 'path';
import { registrarUsoDados } from '../utils/iaLogger.js';

const DATA_FILE = path.resolve(process.cwd(), 'src', 'data', 'produtos-ia.json');

function carregarProdutos() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Formato inválido: esperado array de produtos em produtos-ia.json');
  return data;
}

function logSeguro(payload) {
  try {
    registrarUsoDados(payload);
  } catch {
    // Logging não deve quebrar o fluxo principal do módulo de IA.
  }
}

/**
 * Busca um produto pelo ID no catálogo mockado da IA.
 * @param {string} id
 * @param {string} origem - rota ou ferramenta que chamou
 * @returns {object|null} produto encontrado ou null se não existir
 */
export function buscarProdutoPorIdIA(id, origem = 'desconhecido') {
  const parametros = { id: String(id ?? '') };
  try {
    const produtos = carregarProdutos();
    const produto = produtos.find(p => p.id === String(id)) || null;
    logSeguro({
      funcao: 'buscarProdutoPorIdIA',
      origem,
      parametros,
      quantidadeRetornada: produto ? 1 : 0,
      sucesso: true,
    });
    return produto;
  } catch (erro) {
    logSeguro({
      funcao: 'buscarProdutoPorIdIA',
      origem,
      parametros,
      quantidadeRetornada: 0,
      sucesso: false,
      erro: erro.message,
    });
    throw erro;
  }
}

/**
 * Lista produtos ativos do catálogo mockado da IA.
 * @param {string} origem - rota ou ferramenta que chamou
 * @returns {object[]} lista de produtos ativos (vazia se não houver)
 */
export function listarProdutosAtivosIA(origem = 'desconhecido') {
  try {
    const produtos = carregarProdutos();
    const ativos = produtos.filter(p => p.ativo === true);
    logSeguro({
      funcao: 'listarProdutosAtivosIA',
      origem,
      parametros: {},
      quantidadeRetornada: ativos.length,
      sucesso: true,
    });
    return ativos;
  } catch (erro) {
    logSeguro({
      funcao: 'listarProdutosAtivosIA',
      origem,
      parametros: {},
      quantidadeRetornada: 0,
      sucesso: false,
      erro: erro.message,
    });
    throw erro;
  }
}

/**
 * Busca produtos ativos por categoria (comparação case-insensitive, contém).
 * @param {string} categoria
 * @param {string} origem - rota ou ferramenta que chamou
 * @returns {object[]} produtos encontrados (vazio se não houver)
 */
export function buscarProdutosPorCategoriaIA(categoria, origem = 'desconhecido') {
  const parametros = { categoria: String(categoria ?? '') };
  try {
    const termo = String(categoria ?? '').trim().toLowerCase();
    const produtos = carregarProdutos();
    const encontrados = termo
      ? produtos.filter(p => p.ativo === true && String(p.categoria || '').toLowerCase().includes(termo))
      : [];
    logSeguro({
      funcao: 'buscarProdutosPorCategoriaIA',
      origem,
      parametros,
      quantidadeRetornada: encontrados.length,
      sucesso: true,
    });
    return encontrados;
  } catch (erro) {
    logSeguro({
      funcao: 'buscarProdutosPorCategoriaIA',
      origem,
      parametros,
      quantidadeRetornada: 0,
      sucesso: false,
      erro: erro.message,
    });
    throw erro;
  }
}
