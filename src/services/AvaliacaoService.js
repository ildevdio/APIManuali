import Avaliacao from '../models/Avaliacao.js';
import Product from '../models/Product.js';
import productService from './ProductService.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

const avaliacoes = new Map();

class AvaliacaoService {
  criar(produtoId, usuarioId, nota, comentario) {
    productService.buscarPorId(produtoId);

    const jaAvaliou = Array.from(avaliacoes.values()).some(
      a => a.produtoId === produtoId && a.usuarioId === usuarioId
    );
    if (jaAvaliou) {
      throw new BadRequestError('Você já avaliou este produto.');
    }

    const avaliacao = new Avaliacao(produtoId, usuarioId, nota, comentario);
    avaliacoes.set(avaliacao.id, avaliacao);
    return avaliacao.toGetDto();
  }

  listarPorProduto(produtoId) {
    return Array.from(avaliacoes.values())
      .filter(a => a.produtoId === produtoId)
      .sort((a, b) => b.data - a.data)
      .map(a => a.toGetDto());
  }

  listarPorUsuario(usuarioId) {
    return Array.from(avaliacoes.values())
      .filter(a => a.usuarioId === usuarioId)
      .sort((a, b) => b.data - a.data)
      .map(a => a.toGetDto());
  }

  mediaPorProduto(produtoId) {
    const lista = this.listarPorProduto(produtoId);
    if (lista.length === 0) {
      return { media: 0, total: 0 };
    }
    const media = lista.reduce((sum, a) => sum + a.nota, 0) / lista.length;
    return { media: Math.round(media * 10) / 10, total: lista.length };
  }

  deletar(id) {
    if (!avaliacoes.delete(id)) {
      throw new NotFoundError(`Avaliação de Id ${id} não encontrada.`);
    }
  }
}

export default new AvaliacaoService();
