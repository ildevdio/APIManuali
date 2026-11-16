import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

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
describe.skipIf(!process.env.DATABASE_URL)('Conexão com o banco de dados (PostgreSQL)', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  }, 20000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('responde a uma consulta simples (SELECT 1)', async () => {
    const resultado = await prisma.$queryRaw`SELECT 1 AS ok`;
    expect(Number(resultado[0].ok)).toBe(1);
  });

  it('está conectado a um banco PostgreSQL', async () => {
    const [linha] = await prisma.$queryRaw`SELECT version() AS versao, current_database() AS banco`;
    expect(linha.versao).toMatch(/PostgreSQL/i);
    expect(linha.banco).toBeTruthy();
  });

  it('possui todas as tabelas do modelo físico (migrations aplicadas)', async () => {
    const linhas = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
    `;
    const existentes = linhas.map((l) => l.table_name);
    const faltando = TABELAS_ESPERADAS.filter((t) => !existentes.includes(t));
    expect(faltando, `Tabelas ausentes: ${faltando.join(', ')}`).toEqual([]);
  });

  it('consegue escrever e ler dados (com rollback, não deixa lixo no banco)', async () => {
    const email = `teste-conexao-${Date.now()}@teste.dev`;
    let lido = null;

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            username: 'Teste Conexão',
            password: 'hash-qualquer',
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

  it('aplica os CHECKs do banco (nota de avaliação fora de 1..5 é rejeitada)', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username: 'Teste Check',
            password: 'hash-qualquer',
            email: `teste-check-${Date.now()}@teste.dev`,
            cep: '00000-000',
          },
        });
        const categoria = await tx.categoria.create({ data: { nome: `cat-${Date.now()}` } });
        const artesao = await tx.user.create({
          data: {
            username: 'Artesão Check',
            password: 'hash-qualquer',
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
});