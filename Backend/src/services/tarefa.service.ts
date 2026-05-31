import { TarefaRepository } from '../repositories/tarefa.repository';
import { ChamadoRepository } from '../repositories/chamado.repository';
import { CreateTarefaInput } from '../schemas';

const tarefaRepository = new TarefaRepository();
const chamadoRepository = new ChamadoRepository();

export class TarefaService {
  async findByChamado(chamadoId: string) {
    const chamado = await chamadoRepository.findById(chamadoId);
    if (!chamado) throw new Error('NOT_FOUND');
    return tarefaRepository.findByChamado(chamadoId);
  }

  async create(chamadoId: string, data: CreateTarefaInput) {
    const chamado = await chamadoRepository.findById(chamadoId);
    if (!chamado) throw new Error('NOT_FOUND');

    return tarefaRepository.create(chamadoId, data);
  }

  async fechar(id: string) {
    const tarefa = await tarefaRepository.findById(id);
    if (!tarefa) throw new Error('NOT_FOUND');

    if (tarefa.status === 'fechado') {
      throw new Error('Tarefa já está fechada');
    }

    return tarefaRepository.fechar(id);
  }

  async delete(id: string) {
    const tarefa = await tarefaRepository.findById(id);
    if (!tarefa) throw new Error('NOT_FOUND');
    return tarefaRepository.delete(id);
  }
}
