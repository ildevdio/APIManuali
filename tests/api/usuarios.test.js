import { describe, it, expect } from 'vitest';
import { api, dadosUnicos, CEP_VALIDO } from '../helpers/api.js';

describe('Usuários — TC01 e TC02', () => {
  it('TC01: cria usuário e retorna 201 com os dados e Location', async () => {
    const { username, email } = dadosUnicos('usuario');

    const res = await api.post('/api/usuarios').send({
      username,
      password: 'senha123',
      email,
      cep: CEP_VALIDO
    });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/usuarios/${res.body.id}`);
    expect(res.body).toMatchObject({ username, email, cep: CEP_VALIDO });
    expect(res.body).not.toHaveProperty('password');
  });

  it('TC02: campos obrigatórios vazios retornam 400 com detalhes', async () => {
    const res = await api.post('/api/usuarios').send({
      username: '',
      password: 'senha123',
      email: 'invalido',
      cep: CEP_VALIDO
    });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Erro de validação.');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.some((detalhe) => detalhe.campo === 'username')).toBe(true);
    expect(res.body.details.some((detalhe) => detalhe.campo === 'email')).toBe(true);
  });

  it('TC02/DEF04: cadastro duplicado retorna 409 (username/e-mail já em uso)', async () => {
    const { username, email } = dadosUnicos('duplicado');
    const payload = { username, password: 'senha123', email, cep: CEP_VALIDO };

    const primeiro = await api.post('/api/usuarios').send(payload);
    expect(primeiro.status).toBe(201);

    const segundo = await api.post('/api/usuarios').send(payload);
    expect(segundo.status).toBe(409);
    expect(segundo.body.erro).toMatch(/já está em uso/);
  });

  it('lista usuários cadastrados', async () => {
    const { username, email } = dadosUnicos('listar');
    await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const res = await api.get('/api/usuarios');

    expect(res.status).toBe(200);
    expect(res.body.some((usuario) => usuario.username === username)).toBe(true);
  });

  it('busca usuário por id e por username', async () => {
    const { username, email } = dadosUnicos('busca');
    const criado = await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const porId = await api.get(`/api/usuarios/${criado.body.id}`);
    expect(porId.status).toBe(200);
    expect(porId.body.username).toBe(username);

    const porUsername = await api.get(`/api/usuarios/search?username=${username}`);
    expect(porUsername.status).toBe(200);
    expect(porUsername.body.id).toBe(criado.body.id);
  });

  it('busca usuário inexistente retorna 404', async () => {
    const res = await api.get('/api/usuarios/999999');

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não existe ou não foi localizado/);
  });

  it('atualiza e remove usuário', async () => {
    const { username, email } = dadosUnicos('editar');
    const criado = await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const atualizado = await api.put(`/api/usuarios/${criado.body.id}`).send({
      username: `${username}_novo`,
      email: `novo_${email}`,
      cep: '87654-321',
      password: 'novaSenha123'
    });

    expect(atualizado.status).toBe(200);
    expect(atualizado.body.username).toBe(`${username}_novo`);
    expect(atualizado.body.cep).toBe('87654-321');

    const removido = await api.delete(`/api/usuarios/${criado.body.id}`);
    expect(removido.status).toBe(204);

    const busca = await api.get(`/api/usuarios/${criado.body.id}`);
    expect(busca.status).toBe(404);
  });
});
