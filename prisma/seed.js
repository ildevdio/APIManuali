import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10);

  // Categorias (nome é UNIQUE -> upsert é idempotente)
  const nomesCategorias = ['Cerâmica', 'Tecidos', 'Madeira', 'Cestaria'];
  const categorias = {};
  for (const nome of nomesCategorias) {
    categorias[nome] = await prisma.categoria.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }

  // Artesão (usuario + artesao criados juntos; email é UNIQUE)
  const artesaoUser = await prisma.usuario.upsert({
    where: { email: 'artesao@manuali.dev' },
    update: {},
    create: {
      nome: 'Maria Artesã',
      email: 'artesao@manuali.dev',
      senhaHash,
      artesao: {
        create: {
          cpfCnpj: '12345678901',
          historia: 'Ceramista há 20 anos.',
          tecnica: 'Torno e queima a lenha',
          municipio: 'Cunha',
          statusCuradoria: 'aprovado',
        },
      },
    },
  });

  // Consumidor
  await prisma.usuario.upsert({
    where: { email: 'consumidor@manuali.dev' },
    update: {},
    create: {
      nome: 'João Consumidor',
      email: 'consumidor@manuali.dev',
      senhaHash,
      consumidor: {
        create: { enderecoEntrega: 'Rua Exemplo, 100 - Centro' },
      },
    },
  });

  // Produtos de exemplo (só cria se o artesão ainda não tiver produtos)
  const jaTemProdutos = await prisma.produto.count({
    where: { artesaoId: artesaoUser.id },
  });
  if (jaTemProdutos === 0) {
    await prisma.produto.createMany({
      data: [
        {
          artesaoId: artesaoUser.id,
          categoriaId: categorias['Cerâmica'].id,
          nome: 'Caneca artesanal',
          descricao: 'Caneca de cerâmica feita à mão.',
          preco: '45.90',
          tecnica: 'Torno',
          materialOrigem: 'Argila local',
        },
        {
          artesaoId: artesaoUser.id,
          categoriaId: categorias['Cerâmica'].id,
          nome: 'Vaso pequeno',
          descricao: 'Vaso decorativo esmaltado.',
          preco: '89.00',
          tecnica: 'Modelagem manual',
          materialOrigem: 'Argila local',
        },
      ],
    });
  }

  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
