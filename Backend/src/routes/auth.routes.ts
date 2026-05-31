import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const controller = new AuthController();

router.post('/login', (req, res, next) => controller.login(req, res, next));

export default router;
