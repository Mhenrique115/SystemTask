-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'dev', 'cliente');

-- CreateEnum
CREATE TYPE "ChamadoStatus" AS ENUM ('aberto', 'finalizado');

-- CreateEnum
CREATE TYPE "TarefaStatus" AS ENUM ('aberto', 'fechado');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'cliente',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamados" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "status" "ChamadoStatus" NOT NULL DEFAULT 'aberto',
    "dtInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtFim" TIMESTAMP(3),
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "chamados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dtInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtFim" TIMESTAMP(3),
    "status" "TarefaStatus" NOT NULL DEFAULT 'aberto',

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
