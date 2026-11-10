import { describe, it, expect } from 'vitest';
import { api, dadosUnicos, cpfUnico, criarArtesao, CEP_VALIDO } from '../helpers/api.js';

function formatarCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

describe('Artesãos — TC05', () => {
  it('TC05: cria artesão e retorna 201 com id, CPF normalizado e perfil', async () => {
    const { username, email } = dadosUnicos('artesao');
    const cpf = cpfUnico();

    const res = await api.post('/api/artesaos').send({
      username,
      password: 'senha123',
      email,
      cep: CEP_VALIDO,
      cpf: formatarCpf(cpf),
      bio: 'Ceramista',
      experiencia: '10 anos',
      telefone: '81999999999'
    });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/artesaos/${res.body.id}`);
    expect(res.body.cpf).toBe(cpf);
    expect(res.body).toMatchObject({
      username,
      email,
      bio: 'Ceramista',
      experiencia: '10 anos',
      telefone: '81999999999'
    });
    expect(res.body).not.toHaveProperty('password');
  });

  it('CPF inválido retorna 400', async () => {
    const { username, email } = dadosUnicos('cpfinvalido');

    const res = await api.post('/api/artesaos').send({
      username,
      password: 'senha123',
      email,
      cep: CEP_VALIDO,
      cpf: '111.111.111-11'
    });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Erro de validação.');
  });

  it('artesão duplicado (username) retorna 409', async () => {
    const { username, email } = dadosUnicos('artesaodup');
    await criarArtesao({ username, email });

    const res = await api.post('/api/artesaos').send({
      username,
      password: 'senha123',
      email: `outro_${email}`,
      cep: CEP_VALIDO,
      cpf: cpfUnico()
    });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/já está em uso/);
  });

  it('lista e busca artesão por username', async () => {
    const { username, email } = dadosUnicos('artesaobuscar');
    const criado = await criarArtesao({ username, email });

    const lista = await api.get('/api/artesaos');
    expect(lista.status).toBe(200);
    expect(lista.body.some((artesao) => artesao.id === criado.body.id)).toBe(true);

    const busca = await api.get(`/api/artesaos/search?username=${username}`);
    expect(busca.status).toBe(200);
    expect(busca.body.id).toBe(criado.body.id);
  });

  it('artesão inexistente retorna 404', async () => {
    const res = await api.get('/api/artesaos/999999');

    expect(res.status).toBe(404);
  });
});
