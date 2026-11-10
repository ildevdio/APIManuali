import bcrypt from 'bcryptjs';
import Artesao from '../models/Artesao.js';
import { createSerialQueue } from '../utils/serialQueue.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

class ArtesaoService {
  #artesaos = new Map();
  #filaOperacoes = createSerialQueue();

  async #hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  #normalizarCpf(cpf) {
    return String(cpf).replace(/\D/g, '');
  }

  #validarTexto(valor, campo) {
    if (!valor || !valor.trim()) {
      throw new BadRequestError(`${campo} não pode estar vazio.`);
    }
  }

  #garantirUnicidade(username, email, cpf, ignorarId = null) {
    for (const [, artesao] of this.#artesaos) {
      if (artesao.id === ignorarId) continue;

      if (artesao.username.toLowerCase() === username.toLowerCase()) {
        throw new ConflictError(`O username '${username}' já está em uso.`);
      }

      if (artesao.email.toLowerCase() === email.toLowerCase()) {
        throw new ConflictError(`O e-mail '${email}' já está em uso.`);
      }

      if (artesao.cpf === cpf) {
        throw new ConflictError('Este CPF já está cadastrado.');
      }
    }
  }

  async criar(dto) {
    this.#validarTexto(dto.password, 'Senha');
    this.#validarTexto(dto.username, 'Username');
    this.#validarTexto(dto.email, 'E-mail');
    this.#validarTexto(dto.cep, 'CEP');
    this.#validarTexto(dto.cpf, 'CPF');

    const cpf = this.#normalizarCpf(dto.cpf);
    const senhaHash = await this.#hashPassword(dto.password);

    return this.#filaOperacoes.enqueue(async () => {
      this.#garantirUnicidade(dto.username.trim(), dto.email.trim(), cpf);

      const artesao = new Artesao(
        dto.username.trim(),
        senhaHash,
        dto.email.trim(),
        dto.cep,
        cpf,
        dto.bio,
        dto.experiencia,
        dto.telefone
      );

      this.#artesaos.set(artesao.id, artesao);

      return artesao.toGetDto();
    });
  }

  listar() {
    return Array.from(this.#artesaos.values())
      .sort((a, b) => a.id - b.id)
      .map(a => a.toGetDto());
  }

  buscarPorId(id) {
    const artesao = this.#artesaos.get(id);
    if (!artesao) {
      throw new NotFoundError(`Artesão com Id ${id} não foi encontrado.`);
    }
    return artesao.toGetDto();
  }

  buscarPorUsername(username) {
    const artesao = Array.from(this.#artesaos.values()).find(
      a => a.username.toLowerCase() === username.toLowerCase()
    );
    if (!artesao) {
      throw new NotFoundError(`Artesão '${username}' não foi encontrado.`);
    }
    return artesao.toGetDto();
  }

  async autenticar(username, senha) {
    const artesao = Array.from(this.#artesaos.values()).find(
      a => a.username.toLowerCase() === username.toLowerCase()
    );
    if (!artesao) return null;
    const valida = await bcrypt.compare(senha, artesao.password);
    return valida ? artesao.toGetDto() : null;
  }

  async atualizar(id, dto) {
    const artesao = this.#artesaos.get(id);
    if (!artesao) {
      throw new NotFoundError(`Artesão com Id ${id} não foi encontrado.`);
    }

    this.#validarTexto(dto.username, 'Username');
    this.#validarTexto(dto.email, 'E-mail');
    this.#validarTexto(dto.cep, 'CEP');
    this.#validarTexto(dto.cpf, 'CPF');

    const cpf = this.#normalizarCpf(dto.cpf);

    let novoHash = null;
    if (dto.password && dto.password.trim()) {
      novoHash = await this.#hashPassword(dto.password);
    }

    return this.#filaOperacoes.enqueue(async () => {
      this.#garantirUnicidade(dto.username.trim(), dto.email.trim(), cpf, id);

      artesao.username = dto.username.trim();
      artesao.email = dto.email.trim();
      artesao.cep = dto.cep;
      artesao.cpf = cpf;
      artesao.bio = dto.bio;
      artesao.experiencia = dto.experiencia;
      artesao.telefone = dto.telefone;

      if (novoHash) {
        artesao.password = novoHash;
      }

      return artesao.toGetDto();
    });
  }

  deletar(id) {
    return this.#filaOperacoes.enqueue(() => {
      if (!this.#artesaos.delete(id)) {
        throw new NotFoundError(`Artesão com Id ${id} não foi encontrado.`);
      }
    });
  }
}

export default new ArtesaoService();