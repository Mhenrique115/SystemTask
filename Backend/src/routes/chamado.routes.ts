import { Router } from 'express';
import { ChamadoController } from '../controllers/chamado.controller';
import { TarefaController } from '../controllers/tarefa.controller';
import { authenticate, requireStaff } from '../middlewares/auth.middleware';

const router = Router();
const chamadoController = new ChamadoController();
const tarefaController = new TarefaController();

router.use(authenticate);

router.get('/me', (req, res, next) => chamadoController.findMeusChamados(req, res, next));
router.get('/me/:id', (req, res, next) => chamadoController.findMeuChamadoById(req, res, next));
router.get('/dashboard', requireStaff, (req, res, next) => chamadoController.getDashboard(req, res, next));
router.get('/', requireStaff, (req, res, next) => chamadoController.findAll(req, res, next));
router.get('/:id', requireStaff, (req, res, next) => chamadoController.findById(req, res, next));
router.post('/', requireStaff, (req, res, next) => chamadoController.create(req, res, next));
router.put('/:id', requireStaff, (req, res, next) => chamadoController.update(req, res, next));
router.patch('/:id/finalizar', requireStaff, (req, res, next) => chamadoController.finalizar(req, res, next));
router.delete('/:id', requireStaff, (req, res, next) => chamadoController.delete(req, res, next));

// Tarefas nested under chamados
router.get('/:chamadoId/tarefas', requireStaff, (req, res, next) => tarefaController.findByChamado(req, res, next));
router.post('/:chamadoId/tarefas', requireStaff, (req, res, next) => tarefaController.create(req, res, next));
router.patch('/tarefas/:id/fechar', requireStaff, (req, res, next) => tarefaController.fechar(req, res, next));
router.delete('/tarefas/:id', requireStaff, (req, res, next) => tarefaController.delete(req, res, next));

export default router;
