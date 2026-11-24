import { describe, it, expect } from 'vitest';
import { api, dadosUnicos, criarArtesao, CEP_VALIDO } from '../helpers/api.js';
import admService from '../../src/services/AdmService.js';
import authService from '../../src/services/AuthService.js';

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

  it('TC04: logout encerra a sessão com sucesso', async () => {
    const { username, email } = dadosUnicos('logout');
    await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const login = await api.post('/api/auth/login').send({ username, password: 'senha123' });
    const token = login.body.token;

    const logout = await api.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);
    expect(logout.body.mensagem).toBe('Logout realizado com sucesso.');
  });

  it('TC04: após o logout o token deixa de ser válido (sessão expirada)', async () => {
    const { username, email } = dadosUnicos('sessaoexpirada');
    await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });

    const login = await api.post('/api/auth/login').send({ username, password: 'senha123' });
    const token = login.body.token;

    expect(authService.validarToken(token)).toMatchObject({ papel: 'comprador', username });

    await api.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

    expect(() => authService.validarToken(token)).toThrow(/inválido ou expirado/);
  });

  it('TC04: token inexistente ou ausente é rejeitado pela validação de sessão', () => {
    expect(() => authService.validarToken('token_comprador_falso_123')).toThrow(/inválido ou expirado/);
    expect(() => authService.validarToken(undefined)).toThrow(/inválido ou expirado/);
  });

  it('TC04: logout sem token ou com token desconhecido não quebra (200)', async () => {
    const semToken = await api.post('/api/auth/logout');
    expect(semToken.status).toBe(200);

    const desconhecido = await api.post('/api/auth/logout').set('Authorization', 'Bearer token_qualquer');
    expect(desconhecido.status).toBe(200);
  });

  // Defeito: nenhuma rota de negócio valida o token (exigirAuth não é usado), então a
  // sessão expirada/encerrada não bloqueia nada. Esperado: 401.
  it.fails('TC04/DEF01: token encerrado no logout deveria ser recusado em rota protegida', async () => {
    const { username, email } = dadosUnicos('sessaoprotegida');
    await api.post('/api/usuarios').send({ username, password: 'senha123', email, cep: CEP_VALIDO });
    const login = await api.post('/api/auth/login').send({ username, password: 'senha123' });
    const token = login.body.token;
    await api.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

    const res = await api.get('/api/carrinho').query({ usuarioId: login.body.usuario.id }).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
