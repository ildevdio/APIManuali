import { asyncHandler } from './asyncHandler.js';

const exigirUsuarioId = asyncHandler(async (req, res, next) => {
  const { usuarioId } = req.query;
  if (!usuarioId) {
    return res.status(400).json({ erro: 'usuarioId é obrigatório.' });
  }
  req.usuarioId = usuarioId;
  next();
});

export default exigirUsuarioId;