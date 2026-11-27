import { buscarProdutoPorIdIA, listarProdutosAtivosIA } from './IADataAccess.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

function getConfig() {
  const baseURL = (process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1').replace(/\/$/, '');
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || (baseURL.includes('11434') ? 'ollama' : '');
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'llama3.2';
  return { apiKey, baseURL, model };
}

async function chamarIA(messages, { temperature = 0.4, maxTokens = 700 } = {}) {
  const { apiKey, baseURL, model } = getConfig();
  if (!apiKey) {
    throw new BadRequestError('IA não configurada. Defina AI_API_KEY (ou OPENAI_API_KEY) no .env do backend.');
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || data?.erro || `Erro na IA (${res.status})`;
    throw new BadRequestError(msg);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new BadRequestError('Resposta da IA vazia.');
  try {
    return JSON.parse(content);
  } catch {
    return { texto: content };
  }
}

function resumoProduto(p) {
  return {
    id: p.id,
    nome: p.nome,
    descricao: (p.descricao || '').slice(0, 180),
    preco: Number(p.preco),
    categoria: p.categoria || '',
    estoque: Number(p.estoque ?? 0),
  };
}

class IARecomendacaoService {
  async recomendarPorProduto(produtoId, limite = 4, origem = 'ferramenta:IARecomendacaoService.recomendarPorProduto') {
    const produto = buscarProdutoPorIdIA(produtoId, origem);
    if (!produto) throw new NotFoundError(`Produto com Id ${produtoId} não foi encontrado.`);

    const todos = listarProdutosAtivosIA(origem).filter(p => p.id !== produtoId);
    const candidatos = todos.slice(0, 40).map(resumoProduto);

    if (candidatos.length === 0) {
      return { produto: resumoProduto(produto), recomendacoes: [], justificativa: 'Não há outros produtos ativos no catálogo para recomendar.' };
    }

    const limiteFinal = Math.max(1, Math.min(10, Number(limite) || 4));
    const { apiKey } = getConfig();

    if (!apiKey) {
      const mesmaCategoria = candidatos.filter(c => c.categoria === produto.categoria);
      const outras = candidatos.filter(c => c.categoria !== produto.categoria);
      const recomendacoes = [...mesmaCategoria, ...outras].slice(0, limiteFinal).map(c => ({
        ...c,
        motivo: c.categoria === produto.categoria
          ? `Mesma categoria do produto base (${produto.categoria}).`
          : 'Sugestão complementar de outra categoria do catálogo.',
      }));
      return {
        produto: resumoProduto(produto),
        recomendacoes,
        justificativa: 'Fallback local (sem IA configurada): recomendação por similaridade de categoria.',
        modelo: 'fallback-local',
      };
    }

    try {
      const prompt = {
        produto_base: resumoProduto(produto),
        candidatos,
        limite: limiteFinal,
      };

      const ia = await chamarIA([
        { role: 'system', content: 'Você é um assistente de marketplace artesanal. Recomende produtos similares/complementares com base no produto base e nos candidatos. Responda SOMENTE JSON no formato: {"recomendacoes":[{"id":"...","motivo":"..."}],"justificativa":"..."} . Use apenas ids existentes nos candidatos. Não invente produtos.' },
        { role: 'user', content: JSON.stringify(prompt) },
      ]);

      const ids = Array.isArray(ia?.recomendacoes) ? ia.recomendacoes : [];
      const porId = new Map(todos.map(p => [p.id, p]));
      const recomendacoes = [];
      for (const r of ids) {
        const p = porId.get(r?.id);
        if (!p) continue;
        recomendacoes.push({ ...resumoProduto(p), motivo: String(r?.motivo || '').slice(0, 240) });
        if (recomendacoes.length >= limiteFinal) break;
      }

      return {
        produto: resumoProduto(produto),
        recomendacoes,
        justificativa: String(ia?.justificativa || '').slice(0, 500),
        modelo: getConfig().model,
      };
    } catch (err) {
      // Fallback para garantir repetibilidade sem dependência de LLM externo.
      const mesmaCategoria = candidatos.filter(c => c.categoria === produto.categoria);
      const outras = candidatos.filter(c => c.categoria !== produto.categoria);
      const recomendacoes = [...mesmaCategoria, ...outras].slice(0, limiteFinal).map(c => ({
        ...c,
        motivo: c.categoria === produto.categoria
          ? `Mesma categoria do produto base (${produto.categoria}).`
          : 'Sugestão complementar de outra categoria do catálogo.',
      }));
      return {
        produto: resumoProduto(produto),
        recomendacoes,
        justificativa: `Fallback local (IA indisponível: ${String(err?.message || err).slice(0, 120)}). Recomendação por similaridade de categoria.`,
        modelo: 'fallback-local',
      };
    }
  }

  async buscarPorTexto(consulta, limite = 4, origem = 'ferramenta:IARecomendacaoService.buscarPorTexto') {
    const texto = String(consulta || '').trim();
    if (!texto) throw new BadRequestError('consulta é obrigatória.');

    const todos = listarProdutosAtivosIA(origem);
    const candidatos = todos.slice(0, 60).map(resumoProduto);
    if (candidatos.length === 0) {
      return { consulta: texto, recomendacoes: [], justificativa: 'Não há produtos ativos no catálogo.' };
    }

    const limiteFinal = Math.max(1, Math.min(10, Number(limite) || 4));
    const { apiKey } = getConfig();

    if (!apiKey) {
      const q = texto.toLowerCase();
      const recomendacoes = candidatos
        .filter(c => [c.nome, c.descricao, c.categoria].some(v => String(v).toLowerCase().includes(q)))
        .slice(0, limiteFinal)
        .map(c => ({ ...c, motivo: `Corresponde à consulta "${texto}" por nome/descrição/categoria.` }));
      return {
        consulta: texto,
        recomendacoes,
        justificativa: 'Fallback local (sem IA configurada): busca textual simples no catálogo mockado.',
        modelo: 'fallback-local',
      };
    }

    try {
      const prompt = { consulta: texto, candidatos, limite: limiteFinal };
      const ia = await chamarIA([
        { role: 'system', content: 'Você é um assistente de marketplace artesanal. Dada a consulta do usuário e os candidatos, selecione os produtos mais relevantes. Responda SOMENTE JSON: {"recomendacoes":[{"id":"...","motivo":"..."}],"justificativa":"..."}. Use apenas ids existentes nos candidatos.' },
        { role: 'user', content: JSON.stringify(prompt) },
      ]);

      const ids = Array.isArray(ia?.recomendacoes) ? ia.recomendacoes : [];
      const porId = new Map(todos.map(p => [p.id, p]));
      const recomendacoes = [];
      for (const r of ids) {
        const p = porId.get(r?.id);
        if (!p) continue;
        recomendacoes.push({ ...resumoProduto(p), motivo: String(r?.motivo || '').slice(0, 240) });
        if (recomendacoes.length >= limiteFinal) break;
      }

      return {
        consulta: texto,
        recomendacoes,
        justificativa: String(ia?.justificativa || '').slice(0, 500),
        modelo: getConfig().model,
      };
    } catch (err) {
      const q = texto.toLowerCase();
      const recomendacoes = candidatos
        .filter(c => [c.nome, c.descricao, c.categoria].some(v => String(v).toLowerCase().includes(q)))
        .slice(0, limiteFinal)
        .map(c => ({ ...c, motivo: `Corresponde à consulta "${texto}" por nome/descrição/categoria.` }));
      return {
        consulta: texto,
        recomendacoes,
        justificativa: `Fallback local (IA indisponível: ${String(err?.message || err).slice(0, 120)}). Busca textual simples no catálogo mockado.`,
        modelo: 'fallback-local',
      };
    }
  }
}

export default new IARecomendacaoService();
