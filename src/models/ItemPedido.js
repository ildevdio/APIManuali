class ItemPedido {
  #idProduto;
  #quantidade;
  #precoUnitario;

  constructor(idProduto, quantidade, precoUnitario) {
    if (quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero.');
    }
    this.#idProduto = idProduto;
    this.#quantidade = quantidade;
    this.#precoUnitario = precoUnitario;
  }

  get idProduto() {
    return this.#idProduto;
  }

  get quantidade() {
    return this.#quantidade;
  }

  get precoUnitario() {
    return this.#precoUnitario;
  }

  get subtotal() {
    return this.#precoUnitario * this.#quantidade;
  }

  toGetDto() {
    return {
      idProduto: this.#idProduto,
      quantidade: this.#quantidade,
      precoUnitario: this.#precoUnitario,
      subtotal: this.subtotal
    };
  }
}

export default ItemPedido;