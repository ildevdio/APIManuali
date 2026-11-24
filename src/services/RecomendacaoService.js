import productService from './ProductService.js';
import AvaliacaoService from './AvaliacaoService.js';

function embaralhar(array) {
  const resultado = [...array];

  for (let i = resultado.length - 1; i > 0; i--) {
    const indiceAleatorio = Math.floor(Math.random() * (i + 1));
    [resultado[i], resultado[indiceAleatorio]] = [resultado[indiceAleatorio], resultado[i]];
  }

  return resultado;
}

class RecomendacaoService {
  async produtosRelacionados(produtoId, limite = 4) {
    const produto = await productService.buscarPorId(produtoId);
    const todos = await productService.listar();

    return embaralhar(todos
      .filter(p => p.id !== produtoId && p.ativo)
      .filter(p => p.categoria && p.categoria === produto.categoria))
      .slice(0, limite);
  }

  async maisAvaliados(limite = 5) {
    const todos = (await productService.listar()).filter(p => p.ativo);
    const comAvaliacoes = todos.map(p => {
      const stats = AvaliacaoService.mediaPorProduto(p.id);
      return { ...p, ...stats };
    });
    return comAvaliacoes
      .filter(p => p.total > 0)
      .sort((a, b) => b.media - a.media || b.total - a.total)
      .slice(0, limite);
  }

  async emDestaque(limite = 8) {
    const todos = await productService.listar();
    return todos
      .filter(p => p.ativo && p.estoque > 0)
      .slice(0, limite);
  }
}

export default new RecomendacaoService();
