import bcrypt from 'bcryptjs';
import Adm from '../models/Adm.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

class AdmService {
  #adms = new Map();
  #cadastroLock = Promise.resolve();

  async #hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  #validarTexto(valor, campo) {
    if (!valor || !valor.trim()) {
      throw new BadRequestError(`${campo} não pode estar vazio.`);
    }
  }

  #garantirUnicidade(username, email, ignorarId = null) {
    for (const [, adm] of this.#adms) {
      if (adm.idAdm === ignorarId) continue;

      if (adm.username.toLowerCase() === username.toLowerCase()) {
        throw new ConflictError(`O username '${username}' já está em uso.`);
      }

      if (adm.email.toLowerCase() === email.toLowerCase()) {
        throw new ConflictError(`O e-mail '${email}' já está em uso.`);
      }
    }
  }

  async criar(dto) {
    this.#validarTexto(dto.password, 'Senha');
    this.#validarTexto(dto.username, 'Username');
    this.#validarTexto(dto.email, 'E-mail');

    const senhaHash = await this.#hashPassword(dto.password);

    await this.#cadastroLock;

    this.#cadastroLock = (async () => {
      this.#garantirUnicidade(dto.username.trim(), dto.email.trim());

      const adm = new Adm(dto.username.trim(), senhaHash, dto.email.trim());

      this.#adms.set(adm.idAdm, adm);

      return adm.toGetDto();
    })();

    return this.#cadastroLock;
  }

  listar() {
    return Array.from(this.#adms.values())
      .sort((a, b) => a.idAdm - b.idAdm)
      .map(a => a.toGetDto());
  }

  buscarPorId(id) {
    const adm = this.#adms.get(id);
    if (!adm) {
      throw new NotFoundError(`Administrador com Id ${id} não foi encontrado.`);
    }
    return adm.toGetDto();
  }

  buscarPorUsername(username) {
    const adm = Array.from(this.#adms.values()).find(
      a => a.username.toLowerCase() === username.toLowerCase()
    );
    if (!adm) {
      throw new NotFoundError(`Administrador '${username}' não foi encontrado.`);
    }
    return adm.toGetDto();
  }

  async atualizar(id, dto) {
    const adm = this.#adms.get(id);
    if (!adm) {
      throw new NotFoundError(`Administrador com Id ${id} não foi encontrado.`);
    }

    this.#validarTexto(dto.username, 'Username');
    this.#validarTexto(dto.email, 'E-mail');

    let novoHash = null;
    if (dto.password && dto.password.trim()) {
      novoHash = await this.#hashPassword(dto.password);
    }

    await this.#cadastroLock;

    this.#cadastroLock = (async () => {
      this.#garantirUnicidade(dto.username.trim(), dto.email.trim(), id);

      adm.username = dto.username.trim();
      adm.email = dto.email.trim();

      if (novoHash) {
        adm.password = novoHash;
      }

      return adm.toGetDto();
    })();

    return this.#cadastroLock;
  }

  deletar(id) {
    if (!this.#adms.delete(id)) {
      throw new NotFoundError(`Administrador com Id ${id} não foi encontrado.`);
    }
  }
}

export default new AdmService();