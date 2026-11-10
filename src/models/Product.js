let productIdCounter = 0;

class Product {
  #id;
  #nome;
  #descricao;
  #preco;
  #estoque;
  #ativo;
  #categoria;
  #fotos;
  #historia;
  #artesaoId;

  constructor({ nome, descricao, preco, estoque, ativo, categoria, fotos, historia, artesaoId }) {
    this.#id = ++productIdCounter;
    this.nome = nome;
    this.descricao = descricao;
    this.estoque = estoque;
    this.ativo = ativo;
    this.categoria = categoria;
    this.fotos = fotos;
    this.historia = historia;
    this.artesaoId = artesaoId;
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

  get categoria() {
    return this.#categoria;
  }

  set categoria(value) {
    this.#categoria = value && value.trim() ? value.trim() : '';
  }

  get fotos() {
    return this.#fotos;
  }

  set fotos(value) {
    this.#fotos = Array.isArray(value) ? [...value] : [];
  }

  get historia() {
    return this.#historia;
  }

  set historia(value) {
    this.#historia = value && value.trim() ? value.trim() : '';
  }

  get artesaoId() {
    return this.#artesaoId;
  }

  set artesaoId(value) {
    this.#artesaoId = value;
  }

  toGetDto() {
    return {
      id: this.#id,
      nome: this.#nome,
      descricao: this.#descricao,
      preco: this.#preco,
      estoque: this.#estoque,
      ativo: this.#ativo,
      categoria: this.#categoria,
      fotos: this.#fotos,
      historia: this.#historia,
      artesaoId: this.#artesaoId
    };
  }
}

export default Product;