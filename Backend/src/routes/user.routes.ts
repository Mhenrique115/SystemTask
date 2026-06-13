import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
// teste
const router = Router();
const controller = new UserController();

router.use(authenticate);

router.get('/', (req, res, next) => controller.findAll(req, res, next));
router.get('/clientes', (req, res, next) => controller.findClientes(req, res, next));
router.get('/:id', (req, res, next) => controller.findById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => controller.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => controller.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => controller.delete(req, res, next));

export default router;
