let userIdCounter = 0;

class User {
  #id;
  #username;
  #password;
  #email;
  #cep;

  constructor(username, password, email, cep) {
    this.#id = ++userIdCounter;
    this.username = username;
    this.password = password;
    this.email = email;
    this.cep = cep;
  }

  get id() {
    return this.#id;
  }

  set id(value) {
    this.#id = value;
  }

  get username() {
    return this.#username;
  }

  set username(value) {
    if (!value || !value.trim()) {
      throw new Error('Nome não pode estar vazio');
    }
    this.#username = value.trim();
  }

  get password() {
    return this.#password;
  }

  set password(value) {
    if (!value || !value.trim()) {
      throw new Error('Senha não pode estar vazia');
    }
    this.#password = value;
  }

  get email() {
    return this.#email;
  }

  set email(value) {
    if (!value || !value.trim()) {
      throw new Error('E-mail não pode estar vazio');
    }
    this.#email = value.trim();
  }

  get cep() {
    return this.#cep;
  }

  set cep(value) {
    if (!value || !value.trim()) {
      throw new Error('CEP não pode estar vazio');
    }
    this.#cep = value.trim();
  }

  toGetDto() {
    return {
      id: this.#id,
      username: this.#username,
      email: this.#email,
      cep: this.#cep
    };
  }
}

export default User;