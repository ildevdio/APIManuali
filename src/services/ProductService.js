import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { agruparItens } from '../utils/agruparItens.js';

const PRODUCT_SELECT = {
  id: true,
  nome: true,
  descricao: true,
  preco: true,
  estoque: true,
  ativo: true,
  fotos: true,
  historia: true,
  artesaoId: true,
  categoriaId: true,
  categoria: {
    select: { nome: true }
  }
};

function produtoToDto(produto) {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao || '',
    preco: Number(produto.preco),
    estoque: produto.estoque,
    ativo: produto.ativo,
    categoria: produto.categoria?.nome || '',
    fotos: produto.fotos || [],
    historia: produto.historia || '',
    artesaoId: produto.artesaoId
  };
}

async function garantirCategoria(nome) {
  const n = nome ? nome.trim() : 'sem categoria';
  return prisma.categoria.upsert({ where: { nome: n }, update: {}, create: { nome: n } });
}

async function garantirArtesao(artesaoId) {
  if (artesaoId) {
    const existente = await prisma.artesao.findFirst({ where: { id: artesaoId } });
    if (existente) return artesaoId;
  }
  const user = await prisma.user.upsert({
    where: { email: 'artesao-padrao@teste.local' },
    create: { username: 'artesao-padrao', email: 'artesao-padrao@teste.local', password: '123456', cep: '00000-000' },
    update: { username: 'artesao-padrao' }
  });
  const Artesao = await prisma.artesao.upsert({
    where: { id: user.id },
    create: { id: user.id, cpf: '00000000000' },
    update: { cpf: '00000000000' }
  });
  return Artesao.id;
}

class ProductService {
  _normalizarFotos(dto, atuais = []) {
    if (Array.isArray(dto.fotos) && dto.fotos.length) return dto.fotos.filter(Boolean);
    if (Array.isArray(dto.urlImagensGaleria) && dto.urlImagensGaleria.length) return dto.urlImagensGaleria.filter(Boolean);
    if (dto.urlImagem) return [dto.urlImagem];
    if (dto.imagem) return [dto.imagem];
    if (dto.url) return [dto.url];
    return atuais;
  }

  async criar(dto) {
    if (dto.preco < 0) {
      throw new BadRequestError('Preço deve ser maior que zero.');
    }

    const categoria = await garantirCategoria(dto.categoria);
    const artesaoId = await garantirArtesao(dto.artesaoId);
    const fotos = this._normalizarFotos(dto, []);

    const produto = await prisma.product.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao || null,
        preco: dto.preco,
        estoque: dto.estoque || 0,
        ativo: dto.ativo !== undefined ? dto.ativo : true,
        fotos,
        historia: dto.historia || null,
        artesaoId,
        categoriaId: categoria?.id
      },
      select: PRODUCT_SELECT
    });

    const dtoResult = produtoToDto(produto);
    return dtoResult;
  }

  async listar() {
    const produtos = await prisma.product.findMany({
      select: PRODUCT_SELECT,
      orderBy: { id: 'asc' }
    });
    return produtos.map(produtoToDto);
  }

  async buscarPorId(id) {
    const produto = await prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT
    });
    if (!produto) {
      throw new NotFoundError(`Produto com Id ${id} não foi encontrado...`);
    }
    return produtoToDto(produto);
  }

  async buscarPorNome(nome) {
    const products = await prisma.product.findMany({
      select: PRODUCT_SELECT,
      where: {
        nome: { contains: nome, mode: 'insensitive' }
      },
      orderBy: { id: 'asc' }
    });
    return products.map(produtoToDto);
  }

  async atualizar(id, dto) {
    const existente = await prisma.product.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundError(`Produto com Id ${id} não foi encontrado...`);
    }

    const categoria = await garantirCategoria(dto.categoria);
    const artesaoId = await garantirArtesao(dto.artesaoId);

    const fotos = this._normalizarFotos(dto, existente.fotos || []);

    const produto = await prisma.product.update({
      where: { id },
      data: {
        nome: dto.nome,
        descricao: dto.descricao || null,
        preco: dto.preco,
        estoque: dto.estoque,
        ativo: dto.ativo,
        fotos,
        historia: dto.historia || null,
        artesaoId,
        categoriaId: categoria?.id
      },
      select: PRODUCT_SELECT
    });

    return produtoToDto(produto);
  }

  async deletar(id) {
    const existente = await prisma.product.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundError(`Produto com Id ${id} não foi encontrado...`);
    }
    await prisma.product.delete({ where: { id } });
  }

  async reservarEstoque(itens) {
    const pedidos = agruparItens(itens);

    if (pedidos.some(p => p.quantidade <= 0)) {
      throw new BadRequestError('Quantidade deve ser maior que zero.');
    }

    const produtos = await prisma.product.findMany({
      where: { id: { in: pedidos.map(p => p.idProduto) } }
    });

    const mapa = new Map(produtos.map(p => [p.id, p]));

    for (const { idProduto, quantidade } of pedidos) {
      const produto = mapa.get(idProduto);
      if (!produto) {
        throw new NotFoundError(`Produto com Id ${idProduto} não foi encontrado...`);
      }
      if (!produto.ativo) {
        throw new BadRequestError(`O produto '${produto.nome}' está inativo.`);
      }
      if (produto.estoque < quantidade) {
        throw new ConflictError(`Estoque insuficiente para '${produto.nome}'. Disponível: ${produto.estoque}.`);
      }
    }

    const reservados = [];
    for (const { idProduto, quantidade } of pedidos) {
      const produto = mapa.get(idProduto);
      await prisma.product.update({
        where: { id: idProduto },
        data: { estoque: { decrement: quantidade } }
      });
      reservados.push({
        idProduto,
        quantidade,
        precoUnitario: Number(produto.preco)
      });
    }

    return reservados;
  }

  async devolverEstoque(itens) {
    for (const { idProduto, quantidade } of itens) {
      const produto = await prisma.product.findUnique({ where: { id: idProduto } });
      if (produto) {
        await prisma.product.update({
          where: { id: idProduto },
          data: { estoque: { increment: quantidade } }
        });
      }
    }
  }
}

export default new ProductService();