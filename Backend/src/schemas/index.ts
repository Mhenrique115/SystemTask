import { z } from 'zod';

const telefoneSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().max(20).nullable().optional()
);

// Auth Schemas
export const loginSchema = z.object({
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// User Schemas
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.enum(['admin', 'dev', 'cliente']).default('cliente'),
  active: z.boolean().default(true),
  email: z.string().email('Email inválido').transform((email) => email.toLowerCase()),
  telefone: telefoneSchema,
});

export const searchClientesSchema = z.object({
  search: z.string().trim().max(50).optional().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(['admin', 'dev', 'cliente']).optional(),
  active: z.boolean().optional(),
  email: z.string().email('Email inválido').transform((email) => email.toLowerCase()).optional(),
  telefone: telefoneSchema,
});

// Chamado Schemas
export const createChamadoSchema = z.object({
  nome: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  mensagem: z.string().optional(),
  mensagemHtml: z.string().optional(),
  clienteId: z.string().uuid('ID do cliente invalido'),
  usuarioId: z.string().uuid('ID do usuário inválido'),
  valor: z.number().min(0).default(0),
  valorTipo: z.enum(['hora', 'fixo']).default('hora'),
});

export const updateChamadoSchema = z.object({
  nome: z.string().min(3).optional(),
  mensagem: z.string().optional(),
  mensagemHtml: z.string().optional(),
  clienteId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  valor: z.number().min(0).optional(),
  valorTipo: z.enum(['hora', 'fixo']).optional(),
  dtFim: z.string().datetime().optional(),
  status: z.enum(['aberto', 'finalizado']).optional(),
});

export const finalizarChamadoSchema = z.object({
  dtFim: z.string().datetime().optional(),
});

// Tarefa Schemas
export const createTarefaSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
});

export const fecharTarefaSchema = z.object({
  dtFim: z.string().datetime().optional(),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SearchClientesInput = z.infer<typeof searchClientesSchema>;
export type CreateChamadoInput = z.infer<typeof createChamadoSchema>;
export type UpdateChamadoInput = z.infer<typeof updateChamadoSchema>;
export type CreateTarefaInput = z.infer<typeof createTarefaSchema>;
export type FecharTarefaInput = z.infer<typeof fecharTarefaSchema>;
