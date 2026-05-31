import prisma from '../libs/prisma';
import { CreateTarefaInput } from '../schemas';

export class TarefaRepository {
  async findByChamado(chamadoId: string) {
    return prisma.tarefa.findMany({
      where: { chamadoId },
      orderBy: { dtInicio: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.tarefa.findUnique({ where: { id } });
  }

  async create(chamadoId: string, data: CreateTarefaInput) {
    return prisma.tarefa.create({
      data: {
        chamadoId,
        descricao: data.descricao,
        dtInicio: new Date(),
        status: 'aberto',
      },
    });
  }

  async fechar(id: string) {
    const now = new Date();
    return prisma.tarefa.update({
      where: { id },
      data: {
        dtFim: now,
        status: 'fechado',
      },
    });
  }

  async delete(id: string) {
    return prisma.tarefa.delete({ where: { id } });
  }
}
