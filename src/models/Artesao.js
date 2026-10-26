import User from './User.js';

class Artesao extends User {
  #cpf;

  constructor(username, password, email, cep, cpf) {
    super(username, password, email, cep);
    this.cpf = cpf;
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

  toGetDto() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      cep: this.cep
    };
  }
}

export default Artesao;