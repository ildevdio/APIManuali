let admIdCounter = 0;

class Adm {
  #idAdm;
  #username;
  #password;
  #email;

  constructor(username, password, email) {
    this.#idAdm = ++admIdCounter;
    this.username = username;
    this.password = password;
    this.email = email;
  }

  get idAdm() {
    return this.#idAdm;
  }

  set idAdm(value) {
    this.#idAdm = value;
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

  toGetDto() {
    return {
      idAdm: this.#idAdm,
      username: this.#username,
      email: this.#email
    };
  }
}

export default Adm;