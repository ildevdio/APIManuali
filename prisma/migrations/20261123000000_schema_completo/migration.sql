-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('comprador', 'artesao', 'adm');

-- DropForeignKey
ALTER TABLE "pedido" DROP CONSTRAINT "pedido_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_categoria_id_fkey";

-- DropIndex
DROP INDEX "idx_avaliacao_produto";

-- AlterTable
-- (editado à mão) VARCHAR -> CITEXT tem cast implícito: converte sem perder dados.
-- O índice único "adm_email_key" já existe e é reconstruído com o novo tipo.
ALTER TABLE "adm" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "username" SET DATA TYPE CITEXT,
ALTER COLUMN "email" SET DATA TYPE CITEXT;

-- AlterTable
-- (editado à mão) remove pontuação de CPFs antigos antes de reduzir para 11 caracteres.
ALTER TABLE "artesao" ALTER COLUMN "cpf" SET DATA TYPE CHAR(11) USING regexp_replace("cpf", '\D', '', 'g');

-- AlterTable
ALTER TABLE "categoria" ALTER COLUMN "nome" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "entrega" ADD COLUMN     "entregue_em" TIMESTAMPTZ(6),
ADD COLUMN     "enviado_em" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "pagamento" ADD COLUMN     "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pago_em" TIMESTAMPTZ(6),
ADD COLUMN     "transacao_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "pedido" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "concluido" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "usuario_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "artesao_id" DROP NOT NULL,
ALTER COLUMN "categoria_id" DROP NOT NULL;

-- AlterTable
-- (editado à mão) VARCHAR -> CITEXT tem cast implícito: converte sem perder dados.
-- O índice único "users_email_key" já existe e é reconstruído com o novo tipo.
ALTER TABLE "users" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "username" SET DATA TYPE CITEXT,
ALTER COLUMN "email" SET DATA TYPE CITEXT;

-- CreateTable
CREATE TABLE "sessao" (
    "token" VARCHAR(255) NOT NULL,
    "papel" "Papel" NOT NULL,
    "user_id" UUID,
    "adm_id" UUID,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessao_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "idx_sessao_user" ON "sessao"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessao_adm" ON "sessao"("adm_id");

-- CreateIndex
CREATE INDEX "idx_sessao_expira" ON "sessao"("expira_em");

-- CreateIndex
CREATE UNIQUE INDEX "adm_username_key" ON "adm"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_avaliacao_produto_usuario" ON "avaliacao"("produto_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_transacao_id_key" ON "pagamento"("transacao_id");

-- CreateIndex
CREATE INDEX "idx_pedido_status" ON "pedido"("status");

-- CreateIndex
CREATE INDEX "idx_product_nome_trgm" ON "product" USING GIN ("nome" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_adm_id_fkey" FOREIGN KEY ("adm_id") REFERENCES "adm"("id_adm") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- CHECKs (editado à mão: o Prisma não gera CHECK) ----------

ALTER TABLE users     ADD CONSTRAINT chk_users_cep         CHECK (cep ~ '^[0-9]{5}-?[0-9]{3}$');
ALTER TABLE pedido    ADD CONSTRAINT chk_pedido_cep        CHECK (cep_pedido ~ '^[0-9]{5}-?[0-9]{3}$');
ALTER TABLE artesao   ADD CONSTRAINT chk_artesao_cpf       CHECK (cpf ~ '^[0-9]{11}$');
ALTER TABLE entrega   ADD CONSTRAINT chk_entrega_datas     CHECK (entregue_em IS NULL OR enviado_em IS NULL OR entregue_em >= enviado_em);
ALTER TABLE sessao    ADD CONSTRAINT chk_sessao_expira     CHECK (expira_em > criado_em);
-- Sessão de adm aponta só para adm; sessão de comprador/artesão aponta só para users.
ALTER TABLE sessao    ADD CONSTRAINT chk_sessao_dono       CHECK (
  (papel = 'adm' AND adm_id IS NOT NULL AND user_id IS NULL)
  OR (papel <> 'adm' AND user_id IS NOT NULL AND adm_id IS NULL)
);
