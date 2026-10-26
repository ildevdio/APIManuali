let productIdCounter = 0;

class Product {
  #id;
  #nome;
  #descricao;
  #preco;
  #estoque;
  #ativo;

  constructor(nome, descricao, preco, estoque, ativo) {
    this.#id = ++productIdCounter;
    this.nome = nome;
    this.descricao = descricao;
    this.estoque = estoque;
    this.ativo = ativo;
    this.preco = preco; // por último: preço negativo desativa o produto
  }

  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value;
  }

  get nome() {
    return this.#nome;
  }

  set nome(value) {
    if (!value || !value.trim()) {
      throw new Error('Nome não pode estar vazio.');
    }
    this.#nome = value;
  }

  get descricao() {
    return this.#descricao;
  }

  set descricao(value) {
    this.#descricao = value && value.trim() ? value : ' ';
  }

  get preco() {
    return this.#preco;
  }

  set preco(value) {
    if (value < 0) {
      this.#preco = 0;
      this.#ativo = false;
    } else {
      this.#preco = value;
    }
  }

  get estoque() {
    return this.#estoque;
  }

  set estoque(value) {
    this.#estoque = value;
  }

  get ativo() {
    return this.#ativo;
  }

  set ativo(value) {
    this.#ativo = value;
  }

  toGetDto() {
    return {
      id: this.#id,
      nome: this.#nome,
      preco: this.#preco,
      estoque: this.#estoque,
      ativo: this.#ativo
    };
  }
}

export default Product;