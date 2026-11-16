-- CreateEnum
CREATE TYPE "StatusCuradoria" AS ENUM ('pendente', 'aprovado', 'reprovado');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('pendente', 'aprovado', 'preparado', 'enviado', 'entregue', 'cancelado');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('pix', 'cartaoCredito', 'cartaoDebito', 'boleto');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'aprovado', 'recusado', 'estornado');

-- CreateEnum
CREATE TYPE "StatusEntrega" AS ENUM ('aguardando', 'emTransporte', 'entregue', 'extraviado');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "cep" VARCHAR(9) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artesao" (
    "id" UUID NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "bio" TEXT,
    "experiencia" TEXT,
    "telefone" VARCHAR(20),
    "tecnica" VARCHAR(100),
    "municipio" VARCHAR(100),
    "status_curadoria" "StatusCuradoria" NOT NULL DEFAULT 'pendente',

    CONSTRAINT "artesao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adm" (
    "id_adm" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,

    CONSTRAINT "adm_pkey" PRIMARY KEY ("id_adm")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(80) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "historia" TEXT,
    "artesao_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "tecnica" VARCHAR(100),
    "material_origem" VARCHAR(150),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id_pedido" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cep_pedido" VARCHAR(9) NOT NULL,
    "endereco" VARCHAR(300) NOT NULL DEFAULT '',
    "usuario_id" UUID NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'pendente',
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "item_pedido" (
    "id_pedido" UUID NOT NULL,
    "id_produto" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "item_pedido_pkey" PRIMARY KEY ("id_pedido","id_produto")
);

-- CreateTable
CREATE TABLE "carrinho" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrinho_item" (
    "carrinho_id" UUID NOT NULL,
    "id_produto" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "carrinho_item_pkey" PRIMARY KEY ("carrinho_id","id_produto")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "produto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nota" SMALLINT NOT NULL,
    "comentario" TEXT,
    "data" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_pedido" UUID NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "valor" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrega" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_pedido" UUID NOT NULL,
    "status" "StatusEntrega" NOT NULL DEFAULT 'aguardando',
    "codigo_rastreio" VARCHAR(50),
    "valor_frete" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "entrega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "artesao_cpf_key" ON "artesao"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "adm_email_key" ON "adm"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

-- CreateIndex
CREATE INDEX "idx_product_artesao" ON "product"("artesao_id");

-- CreateIndex
CREATE INDEX "idx_product_categoria" ON "product"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_pedido_usuario" ON "pedido"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_item_pedido_produto" ON "item_pedido"("id_produto");

-- CreateIndex
CREATE UNIQUE INDEX "carrinho_usuario_id_key" ON "carrinho"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_carrinho_item_produto" ON "carrinho_item"("id_produto");

-- CreateIndex
CREATE INDEX "idx_avaliacao_produto" ON "avaliacao"("produto_id");

-- CreateIndex
CREATE INDEX "idx_avaliacao_usuario" ON "avaliacao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_id_pedido_key" ON "pagamento"("id_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "entrega_id_pedido_key" ON "entrega"("id_pedido");

-- AddForeignKey
ALTER TABLE "artesao" ADD CONSTRAINT "artesao_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_artesao_id_fkey" FOREIGN KEY ("artesao_id") REFERENCES "artesao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho" ADD CONSTRAINT "carrinho_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho_item" ADD CONSTRAINT "carrinho_item_carrinho_id_fkey" FOREIGN KEY ("carrinho_id") REFERENCES "carrinho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho_item" ADD CONSTRAINT "carrinho_item_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega" ADD CONSTRAINT "entrega_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE product       ADD CONSTRAINT chk_product_preco        CHECK (preco >= 0);
ALTER TABLE product       ADD CONSTRAINT chk_product_estoque      CHECK (estoque >= 0);
ALTER TABLE pedido        ADD CONSTRAINT chk_pedido_total         CHECK (total >= 0);
ALTER TABLE item_pedido   ADD CONSTRAINT chk_item_pedido_qtd      CHECK (quantidade > 0);
ALTER TABLE item_pedido   ADD CONSTRAINT chk_item_pedido_preco    CHECK (preco_unitario >= 0);
ALTER TABLE carrinho_item ADD CONSTRAINT chk_carrinho_item_qtd    CHECK (quantidade > 0);
ALTER TABLE pagamento     ADD CONSTRAINT chk_pagamento_valor      CHECK (valor >= 0);
ALTER TABLE entrega       ADD CONSTRAINT chk_entrega_frete        CHECK (valor_frete >= 0);
ALTER TABLE avaliacao     ADD CONSTRAINT chk_avaliacao_nota       CHECK (nota BETWEEN 1 AND 5);