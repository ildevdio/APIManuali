import { describe, it, expect } from 'vitest';
import { api, ID_INEXISTENTE, dadosUnicos, criarAdm, criarUsuario, criarArtesao, criarProduto, CEP_VALIDO } from '../helpers/api.js';
import admService from '../../src/services/AdmService.js';

describe('Administradores e controle de acesso — TC07 / DEF01', () => {
  it('cadastra administrador (fluxo funcional atual)', async () => {
    const { username, email } = dadosUnicos('admin');

    const res = await api.post('/api/adms').send({ username, password: 'senha123', email });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ username, email });
    expect(res.body).not.toHaveProperty('password');
  });

  // DEF01 (Crítica/Alta): o relatório registra que a API permite cadastrar
  // administrador sem autenticação. O teste descreve o comportamento ESPERADO
  // (401/403). Enquanto o defeito existir, `it.fails` mantém o CI verde.
  // Quando corrigirem, este teste passa a falhar e deve virar `it`.
  it.fails('TC07/DEF01: cadastro de admin deve exigir autenticação', async () => {
    const { username, email } = dadosUnicos('adminsemauth');

    const res = await api.post('/api/adms').send({ username, password: 'senha123', email });

    expect([401, 403]).toContain(res.status);
  });

  it('lista e busca administrador', async () => {
    const { username, email } = dadosUnicos('adminbusca');
    const criado = await criarAdm({ username, email });

    const lista = await api.get('/api/adms');
    expect(lista.status).toBe(200);
    expect(lista.body.some((adm) => adm.idAdm === criado.body.idAdm)).toBe(true);

    const busca = await api.get(`/api/adms/search?username=${username}`);
    expect(busca.status).toBe(200);
    expect(busca.body.idAdm).toBe(criado.body.idAdm);
  });

  it('admin inexistente retorna 404', async () => {
    const res = await api.get(`/api/adms/${ID_INEXISTENTE}`);

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// TC07: controle de acesso entre perfis e propriedade dos registros.
// Nenhuma rota usa o middleware exigirAuth, então hoje qualquer perfil (ou
// ninguém) executa ações restritas. Os testes `it.fails` descrevem o
// comportamento ESPERADO; quando a API passar a validar o token e o papel,
// eles começam a falhar e devem virar `it`.
// ---------------------------------------------------------------------------
describe('TC07: controle de acesso entre perfis', () => {
  async function tokenDe(papel) {
    if (papel === 'comprador') {
      const { username, email } = dadosUnicos('compradoracesso');
      await criarUsuario({ username, email });
      const login = await api.post('/api/auth/login').send({ username, password: 'senha123' });
      return { token: login.body.token, id: login.body.usuario.id };
    }
    if (papel === 'artesao') {
      const { username, email } = dadosUnicos('artesaoacesso');
      await criarArtesao({ username, email });
      const login = await api.post('/api/auth/login').send({ username, password: 'senha123', tipo: 'artesao' });
      return { token: login.body.token, id: login.body.usuario.id };
    }
    const { username, email } = dadosUnicos('admacesso');
    await admService.criar({ username, password: 'senha123', email });
    const login = await api.post('/api/auth/login').send({ username, password: 'senha123', tipo: 'adm' });
    return { token: login.body.token, id: login.body.usuario.id };
  }

  it('TC07: cada perfil recebe um token com o seu próprio papel', async () => {
    const comprador = await tokenDe('comprador');
    const artesao = await tokenDe('artesao');
    const adm = await tokenDe('adm');

    expect(comprador.token).toMatch(/^token_comprador_/);
    expect(artesao.token).toMatch(/^token_artesao_/);
    expect(adm.token).toMatch(/^token_adm_/);
  });

  it('TC07: comprador não consegue autenticar como artesão nem como administrador', async () => {
    const { username, email } = dadosUnicos('compradorpapel');
    await criarUsuario({ username, email });

    for (const tipo of ['artesao', 'adm']) {
      const res = await api.post('/api/auth/login').send({ username, password: 'senha123', tipo });
      expect(res.status).not.toBe(200);
      expect(res.body.token).toBeUndefined();
    }
  });

  it.fails('TC07/DEF01: comprador não deve cadastrar administrador', async () => {
    const { token } = await tokenDe('comprador');
    const { username, email } = dadosUnicos('adminporcomprador');

    const res = await api
      .post('/api/adms')
      .set('Authorization', `Bearer ${token}`)
      .send({ username, password: 'senha123', email });

    expect([401, 403]).toContain(res.status);
  });

  it.fails('TC07/DEF01: artesão não deve cadastrar administrador', async () => {
    const { token } = await tokenDe('artesao');
    const { username, email } = dadosUnicos('adminporartesao');

    const res = await api
      .post('/api/adms')
      .set('Authorization', `Bearer ${token}`)
      .send({ username, password: 'senha123', email });

    expect([401, 403]).toContain(res.status);
  });

  it.fails('TC07/DEF01: comprador não deve acessar o painel administrativo', async () => {
    const { token } = await tokenDe('comprador');

    const res = await api.get('/api/admin/metricas/vendas').set('Authorization', `Bearer ${token}`);

    expect([401, 403]).toContain(res.status);
  });

  it.fails('TC07/DEF01: comprador não deve cadastrar produto (ação de artesão)', async () => {
    const { token } = await tokenDe('comprador');

    const res = await api
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Produto por comprador', preco: 10, estoque: 1, ativo: true, categoria: 'ceramica' });

    expect([401, 403]).toContain(res.status);
  });

  it.fails('TC07/DEF01: comprador não deve atualizar o status de um pedido', async () => {
    const { token } = await tokenDe('comprador');
    const produto = await criarProduto({ estoque: 3 });
    const pedido = await api.post('/api/pedidos').send({
      itens: [{ idProduto: produto.body.id, quantidade: 1 }],
      cep: CEP_VALIDO
    });

    const res = await api
      .patch(`/api/pedidos/${pedido.body.idPedido}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'aprovado' });

    expect([401, 403]).toContain(res.status);
  });

  it.fails('TC07/DEF01: comprador não deve excluir um artesão', async () => {
    const { token } = await tokenDe('comprador');
    const alvo = await criarArtesao();

    const res = await api.delete(`/api/artesaos/${alvo.body.id}`).set('Authorization', `Bearer ${token}`);

    expect([401, 403]).toContain(res.status);
  });

  it.fails('TC07/DEF01: usuário não deve editar o perfil de outro usuário', async () => {
    const atacante = await tokenDe('comprador');
    const vitima = await criarUsuario();

    const res = await api
      .put(`/api/usuarios/${vitima.body.id}`)
      .set('Authorization', `Bearer ${atacante.token}`)
      .send({ username: vitima.body.username, email: vitima.body.email, cep: CEP_VALIDO });

    expect([401, 403]).toContain(res.status);
  });

  it.fails('TC07/DEF01: artesão não deve editar o perfil de outro artesão', async () => {
    const atacante = await tokenDe('artesao');
    const vitima = await criarArtesao();

    const res = await api
      .put(`/api/artesaos/${vitima.body.id}`)
      .set('Authorization', `Bearer ${atacante.token}`)
      .send({
        username: vitima.body.username,
        email: vitima.body.email,
        cep: CEP_VALIDO,
        cpf: vitima.body.cpf,
        bio: 'perfil alterado por outro artesão'
      });

    expect([401, 403]).toContain(res.status);
  });
});
