import { describe, it, expect } from 'vitest';
import admService from '../../../src/services/AdmService.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../../src/utils/errors.js';

function dadosAdm() {
  const sufixo = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return {
    username: `adm_${sufixo}`,
    email: `adm_${sufixo}@example.com`,
    password: 'senha123'
  };
}

describe('AdmService', () => {
  it('cria administrador e não expõe a senha no DTO', async () => {
    const dados = dadosAdm();

    const adm = await admService.criar(dados);

    expect(adm.idAdm).toBeTypeOf('number');
    expect(adm).toMatchObject({ username: dados.username, email: dados.email });
    expect(adm).not.toHaveProperty('password');
  });

  it('rejeita campos obrigatórios vazios com BadRequestError', async () => {
    await expect(
      admService.criar({ username: '', email: 'a@b.com', password: 'senha123' })
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      admService.criar({ username: 'abc', email: 'a@b.com', password: ' ' })
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita username duplicado com ConflictError', async () => {
    const dados = dadosAdm();
    await admService.criar(dados);

    await expect(
      admService.criar({ ...dados, email: `outro_${dados.email}` })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejeita e-mail duplicado com ConflictError', async () => {
    const dados = dadosAdm();
    await admService.criar(dados);

    await expect(
      admService.criar({ ...dados, username: `${dados.username}_outro` })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('lista, busca por id e por username', async () => {
    const dados = dadosAdm();
    const criado = await admService.criar(dados);

    expect(admService.listar().some((adm) => adm.idAdm === criado.idAdm)).toBe(true);
    expect(admService.buscarPorId(criado.idAdm)).toMatchObject({ idAdm: criado.idAdm });
    expect(admService.buscarPorUsername(dados.username)).toMatchObject({ idAdm: criado.idAdm });
  });

  it('buscar inexistente lança NotFoundError', () => {
    expect(() => admService.buscarPorId(999999)).toThrow(NotFoundError);
    expect(() => admService.buscarPorUsername('nao_existe')).toThrow(NotFoundError);
  });

  it('autentica com senha correta e retorna null com senha errada', async () => {
    const dados = dadosAdm();
    await admService.criar(dados);

    const autenticado = await admService.autenticar(dados.username, dados.password);
    expect(autenticado).toMatchObject({ username: dados.username });

    const invalido = await admService.autenticar(dados.username, 'senhaErrada');
    expect(invalido).toBeNull();

    const inexistente = await admService.autenticar('nao_existe', 'senha123');
    expect(inexistente).toBeNull();
  });

  it('atualiza dados e senha', async () => {
    const dados = dadosAdm();
    const criado = await admService.criar(dados);

    const atualizado = await admService.atualizar(criado.idAdm, {
      username: `${dados.username}_novo`,
      email: `${dados.username}_novo@example.com`,
      password: 'novaSenha123'
    });

    expect(atualizado.username).toBe(`${dados.username}_novo`);
    expect(atualizado.email).toBe(`${dados.username}_novo@example.com`);

    const login = await admService.autenticar(`${dados.username}_novo`, 'novaSenha123');
    expect(login).toMatchObject({ idAdm: criado.idAdm });
  });

  it('permite atualizar mantendo o próprio username/e-mail', async () => {
    const dados = dadosAdm();
    const criado = await admService.criar(dados);

    await expect(
      admService.atualizar(criado.idAdm, {
        username: dados.username,
        email: dados.email,
        password: 'outraSenha123'
      })
    ).resolves.toMatchObject({ idAdm: criado.idAdm });
  });

  it('remove administrador e falha ao remover novamente', async () => {
    const dados = dadosAdm();
    const criado = await admService.criar(dados);

    await expect(admService.deletar(criado.idAdm)).resolves.toBeUndefined();
    await expect(admService.deletar(criado.idAdm)).rejects.toBeInstanceOf(NotFoundError);
  });
});
