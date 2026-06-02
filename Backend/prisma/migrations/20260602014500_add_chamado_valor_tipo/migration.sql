CREATE TYPE "ValorTipo" AS ENUM ('hora', 'fixo');

ALTER TABLE "chamados"
ADD COLUMN "valorTipo" "ValorTipo" NOT NULL DEFAULT 'hora';
