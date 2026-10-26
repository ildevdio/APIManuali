import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

class UsuarioService {
  #usuarios = new Map();
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
    for (const [, usuario] of this.#usuarios) {
      if (usuario.id === ignorarId) continue;

      if (usuario.username.toLowerCase() === username.toLowerCase()) {
        throw new ConflictError(`O username '${username}' já está em uso.`);
      }

      if (usuario.email.toLowerCase() === email.toLowerCase()) {
        throw new ConflictError(`O e-mail '${email}' já está em uso.`);
      }
    }
  }

  async criar(dto) {
    this.#validarTexto(dto.password, 'Senha');
    this.#validarTexto(dto.username, 'Username');
    this.#validarTexto(dto.email, 'E-mail');

    const senhaHash = await this.#hashPassword(dto.password);

    // Aguarda o lock anterior e executa a operação
    await this.#cadastroLock;

    // Cria nova promise para o lock
    this.#cadastroLock = (async () => {
      this.#garantirUnicidade(dto.username.trim(), dto.email.trim());

      const usuario = new User(
        dto.username.trim(),
        senhaHash,
        dto.email.trim(),
        dto.cep
      );

      this.#usuarios.set(usuario.id, usuario);

      return usuario.toGetDto();
    })();

    return this.#cadastroLock;
  }

  listar() {
    return Array.from(this.#usuarios.values())
      .sort((a, b) => a.id - b.id)
      .map(u => u.toGetDto());
  }

  buscarPorId(id) {
    const usuario = this.#usuarios.get(id);
    if (!usuario) {
      throw new NotFoundError(`Usuário de Id ${id} não existe ou não foi localizado...`);
    }
    return usuario.toGetDto();
  }

  buscarPorUsername(username) {
    const usuario = Array.from(this.#usuarios.values()).find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!usuario) {
      throw new NotFoundError(`Usuário de nome ${username} não existe ou não foi localizado...`);
    }
    return usuario.toGetDto();
  }

  async atualizar(id, dto) {
    const usuario = this.#usuarios.get(id);
    if (!usuario) {
      throw new NotFoundError(`Usuário de Id ${id} não existe ou não foi localizado...`);
    }

    this.#validarTexto(dto.username, 'Username');
    this.#validarTexto(dto.email, 'E-mail');
    this.#validarTexto(dto.cep, 'CEP');

    let novoHash = null;
    if (dto.password && dto.password.trim()) {
      novoHash = await this.#hashPassword(dto.password);
    }

    await this.#cadastroLock;

    this.#cadastroLock = (async () => {
      this.#garantirUnicidade(dto.username.trim(), dto.email.trim(), id);

      usuario.username = dto.username.trim();
      usuario.email = dto.email.trim();
      usuario.cep = dto.cep;

      if (novoHash) {
        usuario.password = novoHash;
      }

      return usuario.toGetDto();
    })();

    return this.#cadastroLock;
  }

  deletar(id) {
    if (!this.#usuarios.delete(id)) {
      throw new NotFoundError(`Usuário de Id ${id} não existe ou não foi localizado...`);
    }
  }
}

export default new UsuarioService();