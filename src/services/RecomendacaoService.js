import productService from './ProductService.js';
import AvaliacaoService from './AvaliacaoService.js';

class RecomendacaoService {
  produtosRelacionados(produtoId, limite = 4) {
    const produto = productService.buscarPorId(produtoId);
    const todos = productService.listar();

    const relacionados = todos
      .filter(p => p.id !== produtoId && p.ativo)
      .filter(p => p.categoria && p.categoria === produto.categoria)
      .sort(() => Math.random() - 0.5)
      .slice(0, limite);

    return relacionados;
  }

  maisAvaliados(limite = 5) {
    const todos = productService.listar().filter(p => p.ativo);
    const comAvaliacoes = todos.map(p => {
      const stats = AvaliacaoService.mediaPorProduto(p.id);
      return { ...p, ...stats };
    });
    return comAvaliacoes
      .filter(p => p.total > 0)
      .sort((a, b) => b.media - a.media || b.total - a.total)
      .slice(0, limite);
  }

  emDestaque(limite = 8) {
    return productService.listar()
      .filter(p => p.ativo && p.estoque > 0)
      .slice(0, limite);
  }
}

export default new RecomendacaoService();
