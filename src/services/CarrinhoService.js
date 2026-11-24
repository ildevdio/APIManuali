import Carrinho from '../models/Carrinho.js';
import productService from './ProductService.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

const carrinhos = new Map();

class CarrinhoService {
  #buscarCarrinho(usuarioId) {
    return carrinhos.get(usuarioId) || new Carrinho(usuarioId);
  }

  #validarDisponibilidade(produto, quantidade) {
    if (!produto.ativo) {
      throw new BadRequestError(`O produto '${produto.nome}' está inativo.`);
    }
    if (produto.estoque < quantidade) {
      throw new BadRequestError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.estoque}.`);
    }
  }

  async obterOuCriar(usuarioId) {
    const carrinho = this.#buscarCarrinho(usuarioId);
    return carrinho.toGetDto();
  }

  async listarItens(usuarioId) {
    const carrinho = this.#buscarCarrinho(usuarioId);
    if (carrinho.itens.length === 0) {
      return { itens: [], total: 0 };
    }
    const itensComDetalhes = await Promise.all(carrinho.itens.map(async item => {
      try {
        const produto = await productService.buscarPorId(item.idProduto);
        return {
          ...item,
          nome: produto.nome,
          preco: produto.preco,
          imagem: produto.fotos && produto.fotos.length > 0 ? produto.fotos[0] : null,
          subtotal: produto.preco * item.quantidade
        };
      } catch (e) {
        return { ...item, produtoNaoEncontrado: true };
      }
    }));
    const total = itensComDetalhes.reduce((sum, i) => sum + (i.subtotal || 0), 0);
    return { itens: itensComDetalhes, total };
  }

  async adicionarItem(usuarioId, idProduto, quantidade) {
    const carrinho = this.#buscarCarrinho(usuarioId);
    const produto = await productService.buscarPorId(idProduto);
    this.#validarDisponibilidade(produto, quantidade);

    const existente = carrinho.itens.find(i => i.idProduto === idProduto);
    const novaQuantidade = existente ? existente.quantidade + quantidade : quantidade;

    if (produto.estoque < novaQuantidade) {
      throw new BadRequestError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.estoque}.`);
    }

    carrinho.adicionarOuAtualizar(idProduto, novaQuantidade);
    return carrinho.toGetDto();
  }

  async atualizarItem(usuarioId, idProduto, quantidade) {
    const carrinho = this.#buscarCarrinho(usuarioId);
    if (!carrinho || carrinho.itens.length === 0) {
      throw new NotFoundError('Carrinho não encontrado.');
    }

    const produto = await productService.buscarPorId(idProduto);
    this.#validarDisponibilidade(produto, quantidade);

    carrinho.adicionarOuAtualizar(idProduto, quantidade);
    return carrinho.toGetDto();
  }

  removerItem(usuarioId, idProduto) {
    const carrinho = this.#buscarCarrinho(usuarioId);
    if (!carrinho) {
      throw new NotFoundError('Carrinho não encontrado.');
    }
    carrinho.remover(idProduto);
    return carrinho.toGetDto();
  }

  limpar(usuarioId) {
    const carrinho = this.#buscarCarrinho(usuarioId);
    if (!carrinho) {
      throw new NotFoundError('Carrinho não encontrado.');
    }
    carrinho.limpar();
    return carrinho.toGetDto();
  }
}

export default new CarrinhoService();