import express from 'express';
import authService from '../services/AuthService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// POST: /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password, tipo } = req.body;
  const resultado = await authService.login({ username, password, tipo });
  res.json(resultado);
}));

// POST: /api/auth/logout
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (token) {
    authService.logout(token);
  }
  res.json({ mensagem: 'Logout realizado com sucesso.' });
}));

export default router;
