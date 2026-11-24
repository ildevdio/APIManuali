import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { criarProduto } from '../helpers/api.js';

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile();
  } catch {
    // sem .env: o describe abaixo será pulado
  }
}

const TABELAS_ESPERADAS = [
  'users',
  'artesao',
  'adm',
  'categoria',
  'product',
  'pedido',
  'item_pedido',
  'carrinho',
  'carrinho_item',
  'avaliacao',
  'pagamento',
  'entrega',
];

class Rollback extends Error {}

// Sem DATABASE_URL (ex.: CI sem Postgres) os testes são pulados, não falham.
// Opt-in: com REQUIRE_DB=true, a ausência de DATABASE_URL FALHA em vez de pular em silêncio.
describe.runIf(process.env.REQUIRE_DB === 'true' && !process.env.DATABASE_URL)('TC17: banco obrigatório', () => {
  it('TC17: DATABASE_URL precisa estar definida quando REQUIRE_DB=true', () => {
    expect(process.env.DATABASE_URL, 'DATABASE_URL não definida: os testes de banco seriam pulados').toBeTruthy();
  });
});

describe.skipIf(!process.env.DATABASE_URL)('TC17: Conexão e integridade do banco de dados (PostgreSQL)', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  }, 20000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('TC17: responde a uma consulta simples (SELECT 1)', async () => {
    const resultado = await prisma.$queryRaw`SELECT 1 AS ok`;
    expect(Number(resultado[0].ok)).toBe(1);
  });

  it('TC17: está conectado a um banco PostgreSQL', async () => {
    const [linha] = await prisma.$queryRaw`SELECT version() AS versao, current_database() AS banco`;
    expect(linha.versao).toMatch(/PostgreSQL/i);
    expect(linha.banco).toBeTruthy();
  });

  it('TC17: possui todas as tabelas do modelo físico (migrations aplicadas)', async () => {
    const linhas = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
    `;
    const existentes = linhas.map((l) => l.table_name);
    const faltando = TABELAS_ESPERADAS.filter((t) => !existentes.includes(t));
    expect(faltando, `Tabelas ausentes: ${faltando.join(', ')}`).toEqual([]);
  });

  it('TC17: consegue escrever e ler dados (com rollback, não deixa lixo no banco)', async () => {
    const email = `teste-conexao-${Date.now()}@teste.dev`;
    let lido = null;

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            username: 'Teste Conexão',
            password: 'senha-teste-placeholder-nao-usar',
            email,
            email,
            cep: '00000-000',
          },
        });
        lido = await tx.user.findUnique({ where: { email } });
        throw new Rollback(); // desfaz a transação
      }),
    ).rejects.toBeInstanceOf(Rollback);

    expect(lido).not.toBeNull();
    expect(lido.email).toBe(email);
    expect(lido.id).toMatch(/^[0-9a-f-]{36}$/i); // UUID gerado pelo banco

    // Depois do rollback, o registro não pode existir
    const depois = await prisma.user.count({ where: { email } });
    expect(depois).toBe(0);
  });

  it('TC17: aplica os CHECKs do banco (nota de avaliação fora de 1..5 é rejeitada)', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
username: 'Teste Check',
            password: 'senha-teste-placeholder-nao-usar',
            email: `teste-check-${Date.now()}@teste.dev`,
            email: `teste-check-${Date.now()}@teste.dev`,
            cep: '00000-000',
          },
        });
        const categoria = await tx.categoria.create({ data: { nome: `cat-${Date.now()}` } });
        const artesao = await tx.user.create({
          data: {
            username: 'Artesão Check',
            password: 'senha-teste-placeholder-nao-usar',
            email: `artesao-check-${Date.now()}@teste.dev`,
            email: `artesao-check-${Date.now()}@teste.dev`,
            cep: '00000-000',
            artesao: { create: { cpf: String(Date.now()).slice(-11) } },
          },
        });
        const produto = await tx.product.create({
          data: {
            nome: 'Produto Check',
            preco: '10.00',
            artesaoId: artesao.id,
            categoriaId: categoria.id,
          },
        });
        // nota 9 viola chk_avaliacao_nota -> o banco deve recusar
        await tx.avaliacao.create({
          data: { produtoId: produto.id, usuarioId: user.id, nota: 9 },
        });
      }),
    ).rejects.toThrow();
  });

  it('TC17: registro criado pela API é persistido e relido do banco com os mesmos dados', async () => {
    const res = await criarProduto({ preco: 33.5, estoque: 7, categoria: 'tc17-integridade' });
    expect(res.status).toBe(201);

    try {
      const noBanco = await prisma.product.findUnique({
        where: { id: res.body.id },
        include: { categoria: true }
      });

      expect(noBanco).not.toBeNull();
      expect(noBanco.nome).toBe(res.body.nome);
      expect(Number(noBanco.preco)).toBe(33.5);
      expect(noBanco.estoque).toBe(7);
      expect(noBanco.categoria.nome).toBe('tc17-integridade');
    } finally {
      await prisma.product.delete({ where: { id: res.body.id } }).catch(() => {});
    }
  });

  it('TC17: o CHECK do banco impede estoque negativo', async () => {
    const res = await criarProduto({ estoque: 1 });
    expect(res.status).toBe(201);

    try {
      await expect(
        prisma.product.update({ where: { id: res.body.id }, data: { estoque: -1 } })
      ).rejects.toThrow();

      const depois = await prisma.product.findUnique({ where: { id: res.body.id } });
      expect(depois.estoque).toBe(1);
    } finally {
      await prisma.product.delete({ where: { id: res.body.id } }).catch(() => {});
    }
  });
});
