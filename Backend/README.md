# 🔧 API Chamados — Backend

API REST do sistema de gestão de chamados (Help Desk), construída com Node.js + TypeScript.

**Frontend:** [System_Task](https://github.com/Mhenrique115/System_Task) — [Demo](https://mhenrique115.github.io/System_Task/)

---

## 🚀 Deploy

- **API em produção:** https://api-chamados-886w.onrender.com
- **Plataforma:** Render (Free tier)
- **Banco de dados:** Supabase (PostgreSQL)

---

## 🛠️ Tecnologias

- **Node.js** + **Express**
- **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **JWT** — autenticação
- **bcrypt** — hash de senhas
- **Zod** — validação de entrada
- **Helmet** — segurança HTTP

---

## 📁 Estrutura

```
src/
├── controllers/     # Handlers das rotas
├── services/        # Regras de negócio
├── repositories/    # Acesso ao banco via Prisma
├── routes/          # Definição das rotas
├── schemas/         # Validação com Zod
├── libs/            # JWT, bcrypt, Prisma client
├── middlewares/     # Auth, error handler
└── index.ts         # Entry point
prisma/
└── schema.prisma    # Schema do banco
```

---

## ⚙️ Rodar localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL (Supabase ou local)

### Instalação

```bash
npm install
```

### Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="sua-chave-secreta"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://127.0.0.1:5501"
```

### Banco de dados

```bash
npx prisma generate   # gera o Prisma Client
npx prisma db push    # sincroniza schema com o banco
```

### Iniciar

```bash
npm run dev    # desenvolvimento
npm run build  # build para produção
npm start      # produção
```

---

## 🔌 Endpoints

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Autenticar usuário |

### Usuários *(autenticado)*
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/api/users` | Todos | Listar usuários |
| GET | `/api/users/:id` | Todos | Buscar por ID |
| POST | `/api/users` | Admin | Criar usuário |
| PUT | `/api/users/:id` | Admin | Atualizar usuário |
| DELETE | `/api/users/:id` | Admin | Excluir usuário |

### Chamados *(autenticado)*
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/chamados/dashboard` | Dados do dashboard |
| GET | `/api/chamados` | Listar chamados |
| GET | `/api/chamados/:id` | Buscar por ID |
| POST | `/api/chamados` | Criar chamado |
| PUT | `/api/chamados/:id` | Atualizar chamado |
| PATCH | `/api/chamados/:id/finalizar` | Finalizar chamado |
| DELETE | `/api/chamados/:id` | Excluir chamado |

### Tarefas *(autenticado)*
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/chamados/:chamadoId/tarefas` | Listar tarefas |
| POST | `/api/chamados/:chamadoId/tarefas` | Criar tarefa |
| PATCH | `/api/chamados/tarefas/:id/fechar` | Fechar tarefa |
| DELETE | `/api/chamados/tarefas/:id` | Excluir tarefa |

---

## 🛡️ Segurança

- Senhas com **bcrypt** (12 rounds)
- Autenticação via **JWT**
- Headers de segurança com **Helmet**
- Validação de dados com **Zod**
- Rotas protegidas por middleware de autenticação
- Rotas admin protegidas por middleware de autorização
