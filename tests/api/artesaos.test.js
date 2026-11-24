import { describe, it, expect } from 'vitest';
import { api, ID_INEXISTENTE, dadosUnicos, cpfUnico, criarArtesao, CEP_VALIDO } from '../helpers/api.js';

function formatarCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

describe('Artesãos — TC05 e TC09', () => {
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

  it('TC05: PUT atualiza o perfil e a alteração fica visível em GET /:id', async () => {
    const criado = await criarArtesao();
    const id = criado.body.id;
    const { username, email } = dadosUnicos('artesaoeditado');

    const res = await api.put(`/api/artesaos/${id}`).send({
      username,
      email,
      cep: '54321-000',
      cpf: criado.body.cpf,
      bio: 'Nova bio',
      experiencia: '15 anos',
      telefone: '81988888888'
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      username,
      email,
      bio: 'Nova bio',
      experiencia: '15 anos',
      telefone: '81988888888'
    });
    expect(res.body).not.toHaveProperty('password');

    const consulta = await api.get(`/api/artesaos/${id}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body).toMatchObject({ username, email, bio: 'Nova bio' });
  });

  it('TC05: PUT com nova senha troca a credencial de login', async () => {
    const { username, email } = dadosUnicos('artesaosenha');
    const criado = await criarArtesao({ username, email });

    const res = await api.put(`/api/artesaos/${criado.body.id}`).send({
      username,
      email,
      cep: CEP_VALIDO,
      cpf: criado.body.cpf,
      password: 'novaSenha456'
    });
    expect(res.status).toBe(200);

    const antiga = await api.post('/api/auth/login').send({ username, password: 'senha123', tipo: 'artesao' });
    expect(antiga.status).toBe(400);

    const nova = await api.post('/api/auth/login').send({ username, password: 'novaSenha456', tipo: 'artesao' });
    expect(nova.status).toBe(200);
    expect(nova.body.usuario.papel).toBe('artesao');
  });

  it('TC05: PUT com dados inválidos retorna 400 e id inexistente retorna 404', async () => {
    const criado = await criarArtesao();
    const base = {
      username: criado.body.username,
      email: criado.body.email,
      cep: CEP_VALIDO,
      cpf: criado.body.cpf
    };

    const semEmail = await api.put(`/api/artesaos/${criado.body.id}`).send({ ...base, email: undefined });
    expect(semEmail.status).toBe(400);

    const cpfInvalido = await api.put(`/api/artesaos/${criado.body.id}`).send({ ...base, cpf: '111.111.111-11' });
    expect(cpfInvalido.status).toBe(400);

    const idInvalido = await api.put('/api/artesaos/abc').send(base);
    expect(idInvalido.status).toBe(400);

    const inexistente = await api.put(`/api/artesaos/${ID_INEXISTENTE}`).send(base);
    expect(inexistente.status).toBe(404);
  });

  it('TC05: PUT com username ou CPF de outro artesão retorna 409', async () => {
    const a = await criarArtesao();
    const b = await criarArtesao();
    const base = { username: b.body.username, email: b.body.email, cep: CEP_VALIDO, cpf: b.body.cpf };

    const usernameEmUso = await api.put(`/api/artesaos/${b.body.id}`).send({ ...base, username: a.body.username });
    expect(usernameEmUso.status).toBe(409);

    const cpfEmUso = await api.put(`/api/artesaos/${b.body.id}`).send({ ...base, cpf: a.body.cpf });
    expect(cpfEmUso.status).toBe(409);
  });

  it('TC05: DELETE remove o artesão; repetir ou usar id inexistente retorna 404', async () => {
    const criado = await criarArtesao();

    const removido = await api.delete(`/api/artesaos/${criado.body.id}`);
    expect(removido.status).toBe(204);

    expect((await api.get(`/api/artesaos/${criado.body.id}`)).status).toBe(404);
    expect((await api.delete(`/api/artesaos/${criado.body.id}`)).status).toBe(404);
    expect((await api.delete(`/api/artesaos/${ID_INEXISTENTE}`)).status).toBe(404);
  });

  it('TC09: GET /:id devolve o perfil público do artesão sem a senha', async () => {
    const { username, email } = dadosUnicos('artesaoperfil');
    const criado = await criarArtesao({ username, email, bio: 'Bordadeira', experiencia: '5 anos', telefone: '81977777777' });

    const res = await api.get(`/api/artesaos/${criado.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: criado.body.id,
      username,
      email,
      cpf: criado.body.cpf,
      bio: 'Bordadeira',
      experiencia: '5 anos',
      telefone: '81977777777'
    });
    expect(res.body).not.toHaveProperty('password');
  });

  it('TC09: GET /:id com id fora do formato UUID retorna 400', async () => {
    const res = await api.get('/api/artesaos/abc');
    expect(res.status).toBe(400);
  });

  it('artesão inexistente retorna 404', async () => {
    const res = await api.get(`/api/artesaos/${ID_INEXISTENTE}`);

    expect(res.status).toBe(404);
  });
});
