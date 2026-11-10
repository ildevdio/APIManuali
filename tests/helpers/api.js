import request from 'supertest';
import app from '../../src/app.js';

// App real (sem abrir porta) — mesma configuração usada em produção.
export const api = request(app);

export const CEP_VALIDO = '12345-678';

let sequencia = 0;

// Gera dados únicos para evitar colisão com o estado em memória dos services.
export function dadosUnicos(prefixo = 'teste') {
  sequencia += 1;
  const sufixo = `${Date.now()}_${sequencia}`;
  return {
    username: `${prefixo}_${sufixo}`,
    email: `${prefixo}_${sufixo}@example.com`
  };
}

// CPF válido para o validador do projeto (11 dígitos, não todos iguais).
export function cpfUnico() {
  sequencia += 1;
  return String(90000000000 + sequencia);
}

export async function criarUsuario(overrides = {}) {
  const { username, email } = dadosUnicos('usuario');
  return api.post('/api/usuarios').send({
    username,
    password: 'senha123',
    email,
    cep: CEP_VALIDO,
    ...overrides
  });
}

export async function criarArtesao(overrides = {}) {
  const { username, email } = dadosUnicos('artesao');
  return api.post('/api/artesaos').send({
    username,
    password: 'senha123',
    email,
    cep: CEP_VALIDO,
    cpf: cpfUnico(),
    ...overrides
  });
}

export async function criarAdm(overrides = {}) {
  const { username, email } = dadosUnicos('admin');
  return api.post('/api/adms').send({
    username,
    password: 'senha123',
    email,
    ...overrides
  });
}

export async function criarProduto(overrides = {}) {
  const { username } = dadosUnicos('produto');
  return api.post('/api/products').send({
    nome: `Produto ${username}`,
    descricao: 'Produto de teste',
    preco: 29.9,
    estoque: 10,
    ativo: true,
    categoria: 'ceramica',
    fotos: ['https://example.com/foto.jpg'],
    historia: 'História de teste',
    ...overrides
  });
}

// O estoque é devolvido de forma assíncrona ao deletar um pedido; aguarda
// até o valor esperado aparecer para evitar teste instável.
export async function aguardarEstoque(produtoId, estoqueEsperado, tentativas = 20) {
  let ultimoEstoque;
  for (let i = 0; i < tentativas; i += 1) {
    const res = await api.get(`/api/products/${produtoId}`);
    ultimoEstoque = res.body.estoque;
    if (ultimoEstoque === estoqueEsperado) {
      return ultimoEstoque;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return ultimoEstoque;
}
