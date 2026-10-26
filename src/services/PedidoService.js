import Pedido from '../models/Pedido.js';
import ItemPedido from '../models/ItemPedido.js';
import productService from './ProductService.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

class PedidoService {
  #pedidos = new Map();
  #pedidoLock = Promise.resolve();

  async criar(dto) {
    if (!dto.itens || dto.itens.length === 0) {
      throw new BadRequestError('O pedido precisa ter pelo menos um item.');
    }

    if (!dto.cep || !dto.cep.trim()) {
      throw new BadRequestError('O CEP do pedido não pode estar vazio.');
    }

    const agrupados = new Map();
    for (const item of dto.itens) {
      const atual = agrupados.get(item.idProduto) || 0;
      agrupados.set(item.idProduto, atual + item.quantidade);
    }

    const itensAgrupados = Array.from(agrupados.entries()).map(([idProduto, quantidade]) => ({
      idProduto,
      quantidade
    }));

    let reservados;
    try {
      reservados = await productService.reservarEstoque(itensAgrupados);
    } catch (error) {
      throw error;
    }

    try {
      const itens = reservados.map(r => new ItemPedido(r.idProduto, r.quantidade, r.precoUnitario));
      const pedido = new Pedido(itens, new Date(), dto.cep);
      this.#pedidos.set(pedido.idPedido, pedido);
      return this.#toGetDto(pedido);
    } catch (error) {
      await productService.devolverEstoque(reservados.map(r => ({ idProduto: r.idProduto, quantidade: r.quantidade })));
      throw error;
    }
  }

  listar() {
    return Array.from(this.#pedidos.values())
      .sort((a, b) => a.idPedido - b.idPedido)
      .map(p => this.#toGetDto(p));
  }

  buscarPorId(id) {
    const pedido = this.#pedidos.get(id);
    if (!pedido) {
      throw new NotFoundError(`Pedido com Id ${id} não foi encontrado...`);
    }
    return this.#toGetDto(pedido);
  }

  atualizar(id, dto) {
    return new Promise((resolve, reject) => {
      this.#pedidoLock = this.#pedidoLock.then(() => {
        const pedido = this.#pedidos.get(id);
        if (!pedido) {
          throw new NotFoundError(`Pedido com Id ${id} não foi encontrado...`);
        }

        pedido.cepPedido = dto.cep;
        pedido.concluido = dto.concluido;

        return this.#toGetDto(pedido);
      }).then(resolve).catch(reject);
    });
  }

  deletar(id) {
    return new Promise((resolve, reject) => {
      this.#pedidoLock = this.#pedidoLock.then(() => {
        const pedido = this.#pedidos.get(id);
        if (!pedido) {
          throw new NotFoundError(`Pedido com Id ${id} não foi encontrado...`);
        }

        this.#pedidos.delete(id);

        if (!pedido.concluido) {
          productService.devolverEstoque(
            pedido.itens.map(i => ({ idProduto: i.idProduto, quantidade: i.quantidade }))
          );
        }
      }).then(resolve).catch(reject);
    });
  }

  #toGetDto(p) {
    return {
      idPedido: p.idPedido,
      data: p.data,
      cep: p.cepPedido,
      concluido: p.concluido,
      total: p.total,
      itens: p.itens.map(i => i.toGetDto())
    };
  }
}

export default new PedidoService();