const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  //Criar token de verificação para o usuario ao fazer login
  const token      = authHeader && authHeader.split(' ')[1];

  //Se não tiver Token ele retorna um erro
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login.' });
  }
  
  try { //Cria o token e envia pro cliente
    const payload  = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario    = payload;
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = autenticar;