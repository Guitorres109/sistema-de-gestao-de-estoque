//====================================
//Rotas basicas para obter dados
//====================================
const router   = express.Router();
const auth     = require('../middlewares/auth');
import express from "express";
const Usuario  = require('../models/Usuario');
const Pizza    = require('../models/Pizza');
const Cliente  = require('../models/Cliente');
const Pedido   = require('../models/Pedido');
import { obterLogs } from "../services/logService.js";
import { limiter } from "../utils/limiters.js";
import logger, { logInfo, logWarn, logError, logDebug } from "../utils/logger.js";


router.get("/logs", auth, limiter, async (req, res) => {
  try {
    if (req.usuario?.perfil !== "Administrador")
      return res.status(403).json({ erro: "Acesso restrito" });
    const logs = await obterLogs();
    res.json({
      logs,
    });
  } catch (err) {
    console.error("Erro ao obter logs:", err);
    res.status(500).json({
      erro: "Erro ao obter logs",
    });
  }
});

router.get('/produtos', auth, async (req, res) => {
  try { res.json(await Produtos.findAll()); }
  catch (e) { res.status(500).json({ erro: e.message }); }
});

//====================================
//Rota para obter pizzas por ID
//====================================

router.get('/produtos/:id', auth, async (req, res) => {
  try {
    const p = await Pizza.findById(req.params.id);
    if (!p) return res.status(404).json({ erro: 'Pizza não encontrada' });
    res.json(p);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

//====================================
//Rota para criar pizzas
//====================================

router.post('/produtos', auth, async (req, res) => {
  try {
    if (!req.body.nome || !req.body.ingredientes)
      return res.status(400).json({ erro: 'Nome e ingredientes são obrigatórios' });
    res.status(201).json(await Pizza.create(req.body));
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

//====================================
//Rota para atualizar cadastro de pizzas
//====================================

router.put('/produtos/:id', auth, async (req, res) => {
  try {
    const p = await Pizza.update(req.params.id, req.body);
    if (!p) return res.status(404).json({ erro: 'Pizza não encontrada' });
    res.json(p);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

//====================================
//Rota para deletar dados de pizzas
//====================================

router.delete('/produtos/:id', auth, async (req, res) => {
  try {
    const ok = await Pizza.delete(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Pizza não encontrada' });
    res.json({ mensagem: 'Pizza deletada' });
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

//====================================
//Rota para obter todos os usuarios
//====================================

router.get('/usuarios', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });
    res.json(await Usuario.findAll());
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

//====================================
//Rota para criar novos usuarios
//====================================

router.post('/usuarios', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });
    const { nome, email, senha, perfil } = req.body;
    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    res.status(201).json(await Usuario.create({ nome, email, senha, perfil }));
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ erro: 'E-mail já cadastrado' });
    res.status(500).json({ erro: e.message });
  }
});

//====================================
//Rota para atualizar ID 
//====================================

router.put('/usuarios/:id', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });
    const u = await Usuario.update(req.params.id, req.body);
    if (!u) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(u);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

//====================================
//Rota para deletar os usuarios 
//====================================

router.delete('/usuarios/:id', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });
    const ok = await Usuario.delete(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json({ mensagem: 'Usuário deletado' });
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

module.exports = router;