import prisma from '../libs/prisma';
import { CreateChamadoInput, UpdateChamadoInput } from '../schemas';

export class ChamadoRepository {
  async findAll() {
    return prisma.chamado.findMany({
      include: {
        usuario: { select: { id: true, username: true, role: true } },
        cliente: { select: { id: true, username: true, email: true, telefone: true, role: true } },
        tarefas: true,
      },
      orderBy: { dtInicio: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.chamado.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, username: true, role: true } },
        cliente: { select: { id: true, username: true, email: true, telefone: true, role: true } },
        tarefas: { orderBy: { dtInicio: 'asc' } },
      },
    });
  }

  async findByClienteId(clienteId: string) {
    return prisma.chamado.findMany({
      where: { clienteId },
      include: {
        usuario: { select: { id: true, username: true, role: true } },
        cliente: { select: { id: true, username: true, email: true, telefone: true, role: true } },
        tarefas: true,
      },
      orderBy: { dtInicio: 'desc' },
    });
  }

  async findByIdAndClienteId(id: string, clienteId: string) {
    return prisma.chamado.findFirst({
      where: { id, clienteId },
      include: {
        usuario: { select: { id: true, username: true, role: true } },
        cliente: { select: { id: true, username: true, email: true, telefone: true, role: true } },
        tarefas: { orderBy: { dtInicio: 'asc' } },
      },
    });
  }

  async create(data: CreateChamadoInput) {
    return prisma.chamado.create({
      data,
      include: {
        usuario: { select: { id: true, username: true, role: true } },
        cliente: { select: { id: true, username: true, email: true, telefone: true, role: true } },
        tarefas: true,
      },
    });
  }

  async update(id: string, data: UpdateChamadoInput) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.dtFim) {
      updateData.dtFim = new Date(data.dtFim);
      updateData.status = 'finalizado';
    }

    return prisma.chamado.update({
      where: { id },
      data: updateData,
      include: {
        usuario: { select: { id: true, username: true, role: true } },
        cliente: { select: { id: true, username: true, email: true, telefone: true, role: true } },
        tarefas: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.chamado.delete({ where: { id } });
  }

  async getDashboardStats() {
    const chamados = await prisma.chamado.findMany({
      include: {
        usuario: { select: { id: true, username: true, role: true } },
        cliente: { select: { id: true, username: true, email: true, telefone: true, role: true } },
        tarefas: true,
      },
    });

    return chamados;
  }
};
