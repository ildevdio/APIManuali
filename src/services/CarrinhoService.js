import Carrinho from '../models/Carrinho.js';
import productService from './ProductService.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

const carrinhos = new Map();
let carrinhoCounter = 0;

class CarrinhoService {
  obterOuCriar(usuarioId) {
    let carrinho = Array.from(carrinhos.values()).find(c => c.usuarioId === usuarioId);
    if (!carrinho) {
      carrinho = new Carrinho(usuarioId);
      carrinhos.set(carrinho.id, carrinho);
    }
    return carrinho.toGetDto();
  }

  listarItens(usuarioId) {
    const carrinho = Array.from(carrinhos.values()).find(c => c.usuarioId === usuarioId);
    if (!carrinho) {
      return { itens: [], total: 0 };
    }
    const itensComDetalhes = carrinho.itens.map(item => {
      try {
        const produto = productService.buscarPorId(item.idProduto);
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
    });
    const total = itensComDetalhes.reduce((sum, i) => sum + (i.subtotal || 0), 0);
    return { itens: itensComDetalhes, total };
  }

  adicionarItem(usuarioId, idProduto, quantidade) {
    const produto = productService.buscarPorId(idProduto);
    if (!produto.ativo) {
      throw new BadRequestError(`O produto '${produto.nome}' está inativo.`);
    }
    if (produto.estoque < quantidade) {
      throw new BadRequestError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.estoque}.`);
    }

    let carrinho = Array.from(carrinhos.values()).find(c => c.usuarioId === usuarioId);
    if (!carrinho) {
      carrinho = new Carrinho(usuarioId);
      carrinhos.set(carrinho.id, carrinho);
    }

    const existente = carrinho.itens.find(i => i.idProduto === idProduto);
    const novaQuantidade = existente ? existente.quantidade + quantidade : quantidade;

    if (produto.estoque < novaQuantidade) {
      throw new BadRequestError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.estoque}.`);
    }

    carrinho.adicionarOuAtualizar(idProduto, novaQuantidade);
    return carrinho.toGetDto();
  }

  atualizarItem(usuarioId, idProduto, quantidade) {
    const carrinho = Array.from(carrinhos.values()).find(c => c.usuarioId === usuarioId);
    if (!carrinho) {
      throw new NotFoundError('Carrinho não encontrado.');
    }

    const produto = productService.buscarPorId(idProduto);
    if (!produto.ativo) {
      throw new BadRequestError(`O produto '${produto.nome}' está inativo.`);
    }
    if (produto.estoque < quantidade) {
      throw new BadRequestError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.estoque}.`);
    }

    carrinho.adicionarOuAtualizar(idProduto, quantidade);
    return carrinho.toGetDto();
  }

  removerItem(usuarioId, idProduto) {
    const carrinho = Array.from(carrinhos.values()).find(c => c.usuarioId === usuarioId);
    if (!carrinho) {
      throw new NotFoundError('Carrinho não encontrado.');
    }
    carrinho.remover(idProduto);
    return carrinho.toGetDto();
  }

  limpar(usuarioId) {
    const carrinho = Array.from(carrinhos.values()).find(c => c.usuarioId === usuarioId);
    if (!carrinho) {
      throw new NotFoundError('Carrinho não encontrado.');
    }
    carrinho.limpar();
    return carrinho.toGetDto();
  }
}

export default new CarrinhoService();
