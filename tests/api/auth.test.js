import { describe, it, expect } from 'vitest';
import { api, dadosUnicos, criarArtesao, CEP_VALIDO } from '../helpers/api.js';
import admService from '../../src/services/AdmService.js';

describe('Autenticação — TC03 e TC04', () => {
  it('TC03: login com credenciais válidas retorna 200, token e papel comprador', async () => {
    const { username, email } = dadosUnicos('login');
    await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const res = await api.post('/api/auth/login').send({ username, password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^token_comprador_/);
    expect(res.body.usuario).toMatchObject({ username, email, papel: 'comprador' });
  });

  it('TC04: senha incorreta retorna 400 com "Credenciais inválidas."', async () => {
    const { username, email } = dadosUnicos('senhaerrada');
    await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const res = await api.post('/api/auth/login').send({ username, password: 'senhaErrada' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Credenciais inválidas.');
  });

  it('login de artesão retorna papel artesao', async () => {
    const { username, email } = dadosUnicos('loginartesao');
    await criarArtesao({ username, email });

    const res = await api.post('/api/auth/login').send({ username, password: 'senha123', tipo: 'artesao' });

    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^token_artesao_/);
    expect(res.body.usuario.papel).toBe('artesao');
  });

  it('login de administrador retorna papel adm', async () => {
    const { username, email } = dadosUnicos('loginadm');
    await admService.criar({ username, password: 'senha123', email });

    const res = await api.post('/api/auth/login').send({ username, password: 'senha123', tipo: 'adm' });

    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^token_adm_/);
    expect(res.body.usuario.papel).toBe('adm');
  });

  it('login sem username/senha retorna 400', async () => {
    const res = await api.post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Username e senha são obrigatórios.');
  });

  it('logout invalida o token', async () => {
    const { username, email } = dadosUnicos('logout');
    await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const login = await api.post('/api/auth/login').send({ username, password: 'senha123' });
    const token = login.body.token;

    const logout = await api.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);
    expect(logout.body.mensagem).toBe('Logout realizado com sucesso.');
  });
});
