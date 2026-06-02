-- Link chamados to existing cliente users instead of storing cliente as free text.
ALTER TABLE "chamados" ADD COLUMN "clienteId" TEXT;

-- Preserve existing chamado rows by creating inactive cliente users for legacy names.
INSERT INTO "users" (
    "id",
    "username",
    "password",
    "role",
    "active",
    "email",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT
    'cliente-' || md5("cliente"),
    'cliente_' || substring(md5("cliente") from 1 for 12),
    'migrated-client',
    'cliente'::"Role",
    false,
    'cliente_' || substring(md5("cliente") from 1 for 12) || '@migrado.local',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "chamados"
WHERE "cliente" IS NOT NULL
ON CONFLICT ("username") DO NOTHING;

UPDATE "chamados"
SET "clienteId" = (
    SELECT "users"."id"
    FROM "users"
    WHERE "users"."username" = 'cliente_' || substring(md5("chamados"."cliente") from 1 for 12)
)
WHERE "clienteId" IS NULL;

ALTER TABLE "chamados" ALTER COLUMN "clienteId" SET NOT NULL;

ALTER TABLE "chamados" DROP COLUMN "cliente";

ALTER TABLE "chamados"
ADD CONSTRAINT "chamados_clienteId_fkey"
FOREIGN KEY ("clienteId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
