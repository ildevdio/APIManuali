import ItemPedido from './ItemPedido.js';

let pedidoIdCounter = 0;

const STATUS_PEDIDO = ['pendente', 'aprovado', 'preparado', 'enviado', 'entregue', 'cancelado'];

class Pedido {
  #idPedido;
  #data;
  #cepPedido;
  #endereco;
  #usuarioId;
  #status;
  #concluido;
  #itens;

  constructor(itens, data, cepPedido, usuarioId, endereco, status) {
    const lista = Array.isArray(itens) ? [...itens] : [...itens];

    if (lista.length === 0) {
      throw new Error('O pedido precisa ter pelo menos um item.');
    }

    this.#idPedido = ++pedidoIdCounter;
    this.#itens = lista;
    this.data = data;
    this.cepPedido = cepPedido;
    this.endereco = endereco;
    this.usuarioId = usuarioId;
    this.status = status || 'pendente';
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

  get endereco() {
    return this.#endereco;
  }

  set endereco(value) {
    this.#endereco = value && value.trim() ? value.trim() : '';
  }

  get usuarioId() {
    return this.#usuarioId;
  }

  set usuarioId(value) {
    this.#usuarioId = value;
  }

  get status() {
    return this.#status;
  }

  set status(value) {
    if (value && !STATUS_PEDIDO.includes(value)) {
      throw new Error(`Status inválido. Valores permitidos: ${STATUS_PEDIDO.join(', ')}`);
    }
    this.#status = value || 'pendente';
    this.#concluido = this.#status === 'entregue';
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
      endereco: this.#endereco,
      usuarioId: this.#usuarioId,
      status: this.#status,
      concluido: this.#concluido,
      total: this.total,
      itens: this.#itens.map(item => item.toGetDto())
    };
  }
}

export default Pedido;