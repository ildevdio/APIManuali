import ItemPedido from './ItemPedido.js';

let pedidoIdCounter = 0;

class Pedido {
  #idPedido;
  #data;
  #cepPedido;
  #concluido;
  #itens;

  constructor(itens, data, cepPedido) {
    const lista = Array.isArray(itens) ? [...itens] : [...itens];

    if (lista.length === 0) {
      throw new Error('O pedido precisa ter pelo menos um item.');
    }

    this.#idPedido = ++pedidoIdCounter;
    this.#itens = lista;
    this.data = data;
    this.cepPedido = cepPedido;
    this.concluido = false;
  }

  get idPedido() {
    return this.#idPedido;
  }

  set idPedido(value) {
    this.#idPedido = value;
  }

  get data() {
    return this.#data;
  }

  set data(value) {
    this.#data = value;
  }

  get cepPedido() {
    return this.#cepPedido;
  }

  set cepPedido(value) {
    if (!value || !value.trim()) {
      throw new Error('CEP não pode estar vazio');
    }
    this.#cepPedido = value;
  }

  get concluido() {
    return this.#concluido;
  }

  set concluido(value) {
    this.#concluido = value;
  }

  get itens() {
    return [...this.#itens];
  }

  get total() {
    return this.#itens.reduce((sum, item) => sum + item.subtotal, 0);
  }

  toGetDto() {
    return {
      idPedido: this.#idPedido,
      data: this.#data,
      cep: this.#cepPedido,
      concluido: this.#concluido,
      total: this.total,
      itens: this.#itens.map(item => item.toGetDto())
    };
  }
}

export default Pedido;