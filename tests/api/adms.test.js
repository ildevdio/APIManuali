import { describe, it, expect } from 'vitest';
import { api, dadosUnicos, criarAdm } from '../helpers/api.js';

describe('Administradores — TC07 / DEF01', () => {
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
    const res = await api.get('/api/adms/999999');

    expect(res.status).toBe(404);
  });
});
