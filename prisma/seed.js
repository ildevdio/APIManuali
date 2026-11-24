import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

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

  // Adm (tabela própria, igual ao models/Adm.js)
  await prisma.adm.upsert({
    where: { email: 'adm@manuali.dev' },
    update: {},
    create: {
      username: 'Administrador',
      password,
      email: 'adm@manuali.dev',
    },
  });

  // Artesão (User + Artesao criados juntos; email é UNIQUE)
  const artesaoUser = await prisma.user.upsert({
    where: { email: 'artesao@manuali.dev' },
    update: {},
    create: {
      username: 'Maria Artesã',
      password,
      email: 'artesao@manuali.dev',
      cep: '12530-000',
      artesao: {
        create: {
          cpf: '12345678901',
          bio: 'Ceramista há 20 anos.',
          experiencia: '20 anos de experiência com cerâmica',
          telefone: '12999999999',
          tecnica: 'Torno e queima a lenha',
          municipio: 'Cunha',
          statusCuradoria: 'aprovado',
        },
      },
    },
  });

  // Usuário comum (consumidor)
  await prisma.user.upsert({
    where: { email: 'consumidor@manuali.dev' },
    update: {},
    create: {
      username: 'João Consumidor',
      password,
      email: 'consumidor@manuali.dev',
      cep: '01001-000',
    },
  });

  // Produtos de exemplo (só cria se o artesão ainda não tiver produtos)
  const jaTemProdutos = await prisma.product.count({
    where: { artesaoId: artesaoUser.id },
  });
  if (jaTemProdutos === 0) {
    await prisma.product.createMany({
      data: [
        {
          artesaoId: artesaoUser.id,
          categoriaId: categorias['Cerâmica'].id,
          nome: 'Caneca artesanal',
          descricao: 'Caneca de cerâmica feita à mão.',
          preco: '45.90',
          estoque: 10,
          historia: 'Feita no torno, queimada a lenha.',
          tecnica: 'Torno',
          materialOrigem: 'Argila local',
        },
        {
          artesaoId: artesaoUser.id,
          categoriaId: categorias['Cerâmica'].id,
          nome: 'Vaso pequeno',
          descricao: 'Vaso decorativo esmaltado.',
          preco: '89.00',
          estoque: 5,
          historia: 'Modelado à mão, esmalte natural.',
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
