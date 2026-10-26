import Product from '../models/Product.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

class ProductService {
  #products = new Map();
  #estoqueLock = Promise.resolve();

  criar(dto) {
    const product = new Product(
      dto.nome,
      dto.descricao || '',
      dto.preco,
      dto.estoque || 0,
      dto.ativo !== undefined ? dto.ativo : true
    );

    this.#products.set(product.id, product);

    return product.toGetDto();
  }

  listar() {
    return Array.from(this.#products.values())
      .sort((a, b) => a.id - b.id)
      .map(p => p.toGetDto());
  }

  buscarPorId(id) {
    const product = this.#products.get(id);
    if (!product) {
      throw new NotFoundError(`Produto com Id ${id} não foi encontrado...`);
    }
    return product.toGetDto();
  }

  buscarPorNome(nome) {
    const searchTerm = (nome || '').toLowerCase();
    return Array.from(this.#products.values())
      .filter(p => p.nome.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.id - b.id)
      .map(p => p.toGetDto());
  }

  atualizar(id, dto) {
    return new Promise((resolve, reject) => {
      this.#estoqueLock = this.#estoqueLock.then(() => {
        const product = this.#products.get(id);
        if (!product) {
          throw new NotFoundError(`Produto com Id ${id} não foi encontrado...`);
        }

        product.nome = dto.nome;
        product.descricao = dto.descricao;
        product.estoque = dto.estoque;
        product.ativo = dto.ativo;
        product.preco = dto.preco;

        return product.toGetDto();
      }).then(resolve).catch(reject);
    });
  }

  deletar(id) {
    return new Promise((resolve, reject) => {
      this.#estoqueLock = this.#estoqueLock.then(() => {
        if (!this.#products.delete(id)) {
          throw new NotFoundError(`Produto com Id ${id} não foi encontrado...`);
        }
      }).then(resolve).catch(reject);
    });
  }

  // Retorna array de { idProduto, quantidade, precoUnitario }
  async reservarEstoque(itens) {
    const agrupados = new Map();
    for (const { idProduto, quantidade } of itens) {
      const atual = agrupados.get(idProduto) || 0;
      agrupados.set(idProduto, atual + quantidade);
    }

    const pedidos = Array.from(agrupados.entries()).map(([idProduto, quantidade]) => ({
      idProduto,
      quantidade
    }));

    if (pedidos.some(p => p.quantidade <= 0)) {
      throw new BadRequestError('Quantidade deve ser maior que zero.');
    }

    return new Promise((resolve, reject) => {
      this.#estoqueLock = this.#estoqueLock.then(() => {
        const alvos = [];

        for (const { idProduto, quantidade } of pedidos) {
          const produto = this.#products.get(idProduto);
          if (!produto) {
            throw new NotFoundError(`Produto com Id ${idProduto} não foi encontrado...`);
          }

          if (!produto.ativo) {
            throw new BadRequestError(`O produto '${produto.nome}' está inativo.`);
          }

          if (produto.estoque < quantidade) {
            throw new ConflictError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.estoque}.`);
          }

          alvos.push({ produto, quantidade });
        }

        const reservados = [];
        for (const { produto, quantidade } of alvos) {
          produto.estoque -= quantidade;
          reservados.push({
            idProduto: produto.id,
            quantidade,
            precoUnitario: produto.preco
          });
        }

        return reservados;
      }).then(resolve).catch(reject);
    });
  }

  async devolverEstoque(itens) {
    return new Promise((resolve, reject) => {
      this.#estoqueLock = this.#estoqueLock.then(() => {
        for (const { idProduto, quantidade } of itens) {
          const produto = this.#products.get(idProduto);
          if (produto) {
            produto.estoque += quantidade;
          }
        }
      }).then(resolve).catch(reject);
    });
  }
}

export default new ProductService();