import User from './User.js';

class Artesao extends User {
  #cpf;
  #bio;
  #experiencia;
  #telefone;

  constructor(username, password, email, cep, cpf, bio, experiencia, telefone) {
    super(username, password, email, cep);
    this.cpf = cpf;
    this.bio = bio;
    this.experiencia = experiencia;
    this.telefone = telefone;
  }

  get cpf() {
    return this.#cpf;
  }

  set cpf(value) {
    if (!value || !value.trim()) {
      throw new Error('CPF não pode estar vazio');
    }
    this.#cpf = value.trim();
  }

  get bio() {
    return this.#bio;
  }

  set bio(value) {
    this.#bio = value && value.trim() ? value.trim() : '';
  }

  get experiencia() {
    return this.#experiencia;
  }

  set experiencia(value) {
    this.#experiencia = value && value.trim() ? value.trim() : '';
  }

  get telefone() {
    return this.#telefone;
  }

  set telefone(value) {
    this.#telefone = value && value.trim() ? value.trim() : '';
  }

  toGetDto() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      cep: this.cep,
      cpf: this.#cpf,
      bio: this.#bio,
      experiencia: this.#experiencia,
      telefone: this.#telefone
    };
  }
}

export default Artesao;