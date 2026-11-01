-- CreateEnum
CREATE TYPE "StatusCuradoria" AS ENUM ('pendente', 'aprovado', 'reprovado');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('pendente', 'pago', 'enviado', 'entregue', 'cancelado');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('pix', 'cartaoCredito', 'cartaoDebito', 'boleto');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'aprovado', 'recusado', 'estornado');

-- CreateEnum
CREATE TYPE "StatusEntrega" AS ENUM ('aguardando', 'emTransporte', 'entregue', 'extraviado');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artesao" (
    "usuario_id" UUID NOT NULL,
    "cpf_cnpj" VARCHAR(14) NOT NULL,
    "historia" TEXT,
    "tecnica" VARCHAR(100),
    "municipio" VARCHAR(100) NOT NULL,
    "status_curadoria" "StatusCuradoria" NOT NULL DEFAULT 'pendente',

    CONSTRAINT "artesao_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "consumidor" (
    "usuario_id" UUID NOT NULL,
    "endereco_entrega" VARCHAR(300),

    CONSTRAINT "consumidor_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(80) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artesao_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "tecnica" VARCHAR(100),
    "material_origem" VARCHAR(150),

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consumidor_id" UUID NOT NULL,
    "data_hora" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusPedido" NOT NULL DEFAULT 'pendente',
    "valor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_pedido" (
    "pedido_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "item_pedido_pkey" PRIMARY KEY ("pedido_id","produto_id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pedido_id" UUID NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "valor" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrega" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pedido_id" UUID NOT NULL,
    "status" "StatusEntrega" NOT NULL DEFAULT 'aguardando',
    "codigo_rastreio" VARCHAR(50),
    "valor_frete" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consumidor_id" UUID NOT NULL,
    "artesao_id" UUID NOT NULL,
    "nota" SMALLINT NOT NULL,
    "comentario" TEXT,
    "data" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "artesao_cpf_cnpj_key" ON "artesao"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

-- CreateIndex
CREATE INDEX "idx_produto_artesao" ON "produto"("artesao_id");

-- CreateIndex
CREATE INDEX "idx_produto_categoria" ON "produto"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_pedido_consumidor" ON "pedido"("consumidor_id");

-- CreateIndex
CREATE INDEX "idx_item_pedido_produto" ON "item_pedido"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_pedido_id_key" ON "pagamento"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "entrega_pedido_id_key" ON "entrega"("pedido_id");

-- CreateIndex
CREATE INDEX "idx_avaliacao_artesao" ON "avaliacao"("artesao_id");

-- AddForeignKey
ALTER TABLE "artesao" ADD CONSTRAINT "artesao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumidor" ADD CONSTRAINT "consumidor_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "produto_artesao_id_fkey" FOREIGN KEY ("artesao_id") REFERENCES "artesao"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "produto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_consumidor_id_fkey" FOREIGN KEY ("consumidor_id") REFERENCES "consumidor"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega" ADD CONSTRAINT "entrega_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_consumidor_id_fkey" FOREIGN KEY ("consumidor_id") REFERENCES "consumidor"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_artesao_id_fkey" FOREIGN KEY ("artesao_id") REFERENCES "artesao"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;
