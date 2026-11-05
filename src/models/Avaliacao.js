let avaliacaoIdCounter = 0;

class Avaliacao {
  #id;
  #produtoId;
  #usuarioId;
  #nota;
  #comentario;
  #data;

  constructor(produtoId, usuarioId, nota, comentario) {
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      throw new Error('A nota deve ser um inteiro entre 1 e 5.');
    }
    this.#id = ++avaliacaoIdCounter;
    this.#produtoId = produtoId;
    this.#usuarioId = usuarioId;
    this.#nota = nota;
    this.#comentario = comentario && comentario.trim() ? comentario.trim() : '';
    this.#data = new Date();
  }

  get id() {
    return this.#id;
  }

  get produtoId() {
    return this.#produtoId;
  }

  get usuarioId() {
    return this.#usuarioId;
  }

  get nota() {
    return this.#nota;
  }

  get comentario() {
    return this.#comentario;
  }

  get data() {
    return this.#data;
  }

  toGetDto() {
    return {
      id: this.#id,
      produtoId: this.#produtoId,
      usuarioId: this.#usuarioId,
      nota: this.#nota,
      comentario: this.#comentario,
      data: this.#data.toISOString()
    };
  }
}

export default Avaliacao;
