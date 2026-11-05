let carrinhoIdCounter = 0;

class CarrinhoItem {
  #idProduto;
  #quantidade;

  constructor(idProduto, quantidade) {
    if (quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero.');
    }
    this.#idProduto = idProduto;
    this.#quantidade = quantidade;
  }

  get idProduto() {
    return this.#idProduto;
  }

  get quantidade() {
    return this.#quantidade;
  }

  set quantidade(value) {
    if (value <= 0) {
      throw new Error('Quantidade deve ser maior que zero.');
    }
    this.#quantidade = value;
  }

  toGetDto() {
    return {
      idProduto: this.#idProduto,
      quantidade: this.#quantidade
    };
  }
}

class Carrinho {
  #id;
  #usuarioId;
  #itens;
  #atualizadoEm;

  constructor(usuarioId, itens = []) {
    this.#id = ++carrinhoIdCounter;
    this.#usuarioId = usuarioId;
    this.#itens = new Map();
    for (const item of itens) {
      this.#itens.set(item.idProduto, new CarrinhoItem(item.idProduto, item.quantidade));
    }
    this.#atualizadoEm = new Date();
  }

  get id() {
    return this.#id;
  }

  get usuarioId() {
    return this.#usuarioId;
  }

  get itens() {
    return Array.from(this.#itens.values()).map(i => i.toGetDto());
  }

  get atualizadoEm() {
    return this.#atualizadoEm;
  }

  adicionarOuAtualizar(idProduto, quantidade) {
    if (quantidade <= 0) {
      this.#itens.delete(idProduto);
    } else {
      this.#itens.set(idProduto, new CarrinhoItem(idProduto, quantidade));
    }
    this.#atualizadoEm = new Date();
  }

  remover(idProduto) {
    const removido = this.#itens.delete(idProduto);
    if (removido) {
      this.#atualizadoEm = new Date();
    }
    return removido;
  }

  limpar() {
    this.#itens.clear();
    this.#atualizadoEm = new Date();
  }

  toGetDto() {
    return {
      id: this.#id,
      usuarioId: this.#usuarioId,
      itens: this.itens,
      atualizadoEm: this.#atualizadoEm.toISOString()
    };
  }
}

export { Carrinho, CarrinhoItem };
export default Carrinho;
