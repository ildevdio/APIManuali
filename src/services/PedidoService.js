import Pedido from '../models/Pedido.js';
import ItemPedido from '../models/ItemPedido.js';
import productService from './ProductService.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { createSerialQueue } from '../utils/serialQueue.js';
import { agruparItens } from '../utils/agruparItens.js';

class PedidoService {
  #pedidos = new Map();
  #filaOperacoes = createSerialQueue();

  async criar(dto) {
    if (!dto.itens || dto.itens.length === 0) {
      throw new BadRequestError('O pedido precisa ter pelo menos um item.');
    }

    if (!dto.cep || !dto.cep.trim()) {
      throw new BadRequestError('O CEP do pedido não pode estar vazio.');
    }

    const itensAgrupados = agruparItens(dto.itens);
    const reservados = await productService.reservarEstoque(itensAgrupados);

    try {
      const itens = reservados.map(r => new ItemPedido(r.idProduto, r.quantidade, r.precoUnitario));
      const pedido = new Pedido(
        itens,
        new Date(),
        dto.cep,
        dto.usuarioId,
        dto.endereco,
        'pendente'
      );
      this.#pedidos.set(pedido.idPedido, pedido);
      return pedido.toGetDto();
    } catch (error) {
      await productService.devolverEstoque(reservados.map(r => ({ idProduto: r.idProduto, quantidade: r.quantidade })));
      throw error;
    }
  }

  listar({ usuarioId, status } = {}) {
    return Array.from(this.#pedidos.values())
      .filter(p => (!usuarioId || p.usuarioId === usuarioId) && (!status || p.status === status))
      .map(p => p.toGetDto());
  }

  buscarPorId(id) {
    const pedido = this.#pedidos.get(id);
    if (!pedido) {
      throw new NotFoundError(`Pedido com Id ${id} não foi encontrado...`);
    }
    return pedido.toGetDto();
  }

  atualizar(id, dto) {
    return this.#filaOperacoes.enqueue(() => {
      const pedido = this.#pedidos.get(id);
      if (!pedido) {
        throw new NotFoundError(`Pedido com Id ${id} não foi encontrado...`);
      }

      pedido.cepPedido = dto.cep;
      pedido.concluido = dto.concluido;

      return pedido.toGetDto();
    });
  }

  atualizarStatus(id, status) {
    return this.#filaOperacoes.enqueue(() => {
      const pedido = this.#pedidos.get(id);
      if (!pedido) {
        throw new NotFoundError(`Pedido com Id ${id} não foi encontrado...`);
      }

      pedido.status = status;

      return pedido.toGetDto();
    });
  }

  deletar(id) {
    return this.#filaOperacoes.enqueue(async () => {
      const pedido = this.#pedidos.get(id);
      if (!pedido) {
        throw new NotFoundError(`Pedido com Id ${id} não foi encontrado...`);
      }

      if (!pedido.concluido) {
        await productService.devolverEstoque(
          pedido.itens.map(i => ({ idProduto: i.idProduto, quantidade: i.quantidade }))
        );
      }

      this.#pedidos.delete(id);
    });
  }
}

export default new PedidoService();
