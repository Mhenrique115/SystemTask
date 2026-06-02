import { ChamadoRepository } from '../repositories/chamado.repository';
import { UserRepository } from '../repositories/user.repository';
import { CreateChamadoInput, UpdateChamadoInput } from '../schemas';

const chamadoRepository = new ChamadoRepository();
const userRepository = new UserRepository();

function calcularDuracaoMinutos(dtInicio: Date, dtFim: Date): number {
  return Math.round((dtFim.getTime() - dtInicio.getTime()) / 60000);
}

function calcularTempoTotalChamado(chamado: {
  dtInicio: Date;
  dtFim: Date | null;
  tarefas: Array<{ dtInicio: Date; dtFim: Date | null }>;
}): number {
  if (chamado.tarefas.length > 0) {
    const totalTarefas = chamado.tarefas.reduce((acc, tarefa) => {
      if (tarefa.dtFim) {
        return acc + calcularDuracaoMinutos(tarefa.dtInicio, tarefa.dtFim);
      }
      return acc;
    }, 0);
    if (totalTarefas > 0) return totalTarefas;
  }

  if (chamado.dtFim) {
    return calcularDuracaoMinutos(chamado.dtInicio, chamado.dtFim);
  }

  return 0;
}

function enrichChamado(chamado: {
  id: string;
  nome: string;
  mensagem: string | null;
  mensagemHtml: string | null;
  clienteId: string;
  usuarioId: string;
  status: string;
  dtInicio: Date;
  dtFim: Date | null;
  valor: number;
  valorTipo: 'hora' | 'fixo';
  usuario: { id: string; username: string; role: string };
  cliente: { id: string; username: string; email: string; telefone: string | null; role: string };
  tarefas: Array<{ id: string; chamadoId: string; descricao: string; dtInicio: Date; dtFim: Date | null; status: string }>;
}) {
  const tarefasComDuracao = chamado.tarefas.map((t) => ({
    ...t,
    duracaoMinutos: t.dtFim ? calcularDuracaoMinutos(t.dtInicio, t.dtFim) : null,
  }));

  const tempoTotalMinutos = calcularTempoTotalChamado(chamado);
  const valorTotal = chamado.valorTipo === 'fixo'
    ? chamado.valor || 0
    : (chamado.valor || 0) * (tempoTotalMinutos / 60);

  return {
    ...chamado,
    tarefas: tarefasComDuracao,
    tempoTotalMinutos,
    valorTotal,
    tempoTotalFormatado:
      tempoTotalMinutos > 0
        ? `${Math.floor(tempoTotalMinutos / 60)}h ${tempoTotalMinutos % 60}m`
        : '0h 0m',
  };
}

type EnrichedChamado = ReturnType<typeof enrichChamado>;
type ChamadoForEnrichment = Parameters<typeof enrichChamado>[0];

export class ChamadoService {
  private async validateCliente(clienteId: string) {
    const cliente = await userRepository.findById(clienteId);
    if (!cliente) throw new Error('CLIENTE_NOT_FOUND');
    if (cliente.role !== 'cliente') throw new Error('CLIENTE_INVALIDO');
    if (!cliente.active) throw new Error('CLIENTE_INATIVO');
  }

  async findAll() {
    const chamados = await chamadoRepository.findAll();
    return chamados.map(enrichChamado);
  }

  async findById(id: string) {
    const chamado = await chamadoRepository.findById(id);
    if (!chamado) throw new Error('NOT_FOUND');
    return enrichChamado(chamado);
  }

  async findByCliente(clienteId: string) {
    const chamados = await chamadoRepository.findByClienteId(clienteId);
    return chamados.map(enrichChamado);
  }

  async findByIdForCliente(id: string, clienteId: string) {
    const chamado = await chamadoRepository.findByIdAndClienteId(id, clienteId);
    if (!chamado) throw new Error('NOT_FOUND');
    return enrichChamado(chamado);
  }

  async create(data: CreateChamadoInput) {
    await this.validateCliente(data.clienteId);
    const chamado = await chamadoRepository.create(data);
    return enrichChamado(chamado);
  }

  async update(id: string, data: UpdateChamadoInput) {
    const chamado = await chamadoRepository.findById(id);
    if (!chamado) throw new Error('NOT_FOUND');

    if (data.clienteId) {
      await this.validateCliente(data.clienteId);
    }

    const updated = await chamadoRepository.update(id, data);
    return enrichChamado(updated);
  }

  async finalizar(id: string) {
    const chamado = await chamadoRepository.findById(id);
    if (!chamado) throw new Error('NOT_FOUND');
    if (chamado.status === 'finalizado') {
      throw new Error('Chamado já finalizado');
    }

    const updated = await chamadoRepository.update(id, {
      dtFim: new Date().toISOString(),
      status: 'finalizado',
    });
    return enrichChamado(updated);
  }

  async delete(id: string) {
    const chamado = await chamadoRepository.findById(id);
    if (!chamado) throw new Error('NOT_FOUND');
    return chamadoRepository.delete(id);
  }

  async getDashboard() {
    const chamados = await chamadoRepository.getDashboardStats() as ChamadoForEnrichment[];
    const enriched: EnrichedChamado[] = chamados.map((chamado) => enrichChamado(chamado));

    // Top users by finalized chamados
    const userCounts: Record<string, { username: string; count: number }> = {};
    enriched.forEach((c) => {
      if (c.status === 'finalizado') {
        const uid = c.usuarioId;
        if (!userCounts[uid]) {
          userCounts[uid] = { username: c.usuario.username, count: 0 };
        }
        userCounts[uid].count++;
      }
    });

    const topUsuarios = Object.entries(userCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top chamados by duration
    const topPorTempo = [...enriched]
      .sort((a, b) => b.tempoTotalMinutos - a.tempoTotalMinutos)
      .slice(0, 5)
      .map((c) => ({ id: c.id, nome: c.nome, tempoTotalMinutos: c.tempoTotalMinutos, tempoFormatado: c.tempoTotalFormatado }));

    // Top chamados by value
    const topPorValor = [...enriched]
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5)
      .map((c) => ({ id: c.id, nome: c.nome, valor: c.valor, valorTotal: c.valorTotal }));

    // Summary list
    const resumo = enriched.map((c) => ({
      id: c.id,
      nome: c.nome,
      status: c.status,
      tempoTotalMinutos: c.tempoTotalMinutos,
      tempoFormatado: c.tempoTotalFormatado,
      valor: c.valor,
      valorTipo: c.valorTipo,
      valorTotal: c.valorTotal,
    }));

    return { resumo, topUsuarios, topPorTempo, topPorValor };
  }
}
