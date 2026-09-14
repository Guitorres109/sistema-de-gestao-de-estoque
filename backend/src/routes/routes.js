//====================================
//Rotas basicas para obter dados
//====================================
import auth from "../middlewares/auth.js";
import express from "express";
import Usuario from "../models/usuario.js";
import Produto from "../models/produto.js";
import Saida from "../models/saidas.js";
import { obterLogs } from "../services/logService.js";
import { limiter } from "../utils/limiters.js";
import logger, { logInfo, logWarn, logError, logDebug } from "../utils/logger.js";
const router   = express.Router();


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
  try { res.json(await Produto.findAll()); }
  catch (e) { res.status(500).json("Erro ao fornecer produtos"); 
    logError("Erro ao fornecer produtos")
    console.error(e)
}
});

//====================================
//Rota para obter pizzas por ID
//====================================

router.get('/produtos/:id', auth, async (req, res) => {
  try {
    const p = await Produto.findById(req.params.id);
    if (!p) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(p);
  } catch (e) { 
    res.status(500).json("Erro ao fornecer produtos"); 
    logError("Erro ao fornecer produtos")
    console.error(e)
}
});

//====================================
//Rota para criar pizzas
//====================================

router.post('/produtos', auth,  async (req, res) => {
  try {
    res.status(201).json(await Produto.create(req.body));
  } catch (e) { 
    res.status(500).json("Erro ao criar produto"); 
    logError("Erro ao criar produto")
    console.error(e) 
}
});

//====================================
//Rota para atualizar cadastro de pizzas
//====================================

router.put('/produtos/:id', auth,  async (req, res) => {
  try {
    req.body.usuario_id = req.usuario.id
    const p = await Produto.update(req.params.id, req.body);
    if (!p) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(p);
  } catch (e) {
    res.status(500).json("Erro ao atualizar produto"); 
    logError("Erro ao atualizar produto")
    console.error(e) 
   }
});

//====================================
//Rota para deletar dados de pizzas
//====================================

router.delete('/produtos/:id', auth, async (req, res) => {
  try {
    const ok = await Produto.delete(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json({ mensagem: 'Produto Deletado' });
  } catch (e) { 
    res.status(500).json("Erro ao deletar produto"); 
    logError("Erro ao deletar produto")
    console.error(e) 
   }
});

router.get('/saidas', auth, async (req, res) => {
  try { res.json(await Saida.findAll()); }
  catch (e) { res.status(500).json("Erro ao fornecer saidas"); 
    logError("Erro ao fornecer saidas")
    console.error(e)
}
});

//====================================
//Rota para obter pizzas por ID
//====================================

router.get('/saidas/:id', auth, async (req, res) => {
  try {
    const p = await Saida.findById(req.params.id);
    if (!p) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(p);
  } catch (e) { 
    res.status(500).json("Erro ao fornecer saidas"); 
    logError("Erro ao fornecer saidas")
    console.error(e)
}
});

//====================================
//Rota para criar pizzas
//====================================

router.post('/saidas', auth,  async (req, res) => {
  try {
    req.body.usuario_id = req.usuario.id
    res.status(201).json(await Saida.create(req.body));
  } catch (e) { 
    res.status(500).json("Erro ao adicionar saida"); 
    logError("Erro ao adicionar saida")
    console.error(e) 
}
});

//====================================
//Rota para atualizar cadastro de pizzas
//====================================

router.put('/saidas/:id', auth,  async (req, res) => {
  try {
    req.body.usuario_id = req.usuario.id
    const p = await Saida.update(req.params.id, req.body);
    if (!p) return res.status(404).json({ erro: 'Saida não encontrada' });
    res.json(p);
  } catch (e) {
    res.status(500).json("Erro ao atualizar saida"); 
    logError("Erro ao atualizar saida")
    console.error(e) 
   }
});

//====================================
//Rota para deletar dados de pizzas
//====================================

router.delete('/saidas/:id', auth, async (req, res) => {
  try {
    const ok = await Saida.delete(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Saida não encontrada' });
    res.json({ mensagem: 'Saida Deletada' });
  } catch (e) { 
    res.status(500).json("Erro ao deletar saida"); 
    logError("Erro ao deletar saida")
    console.error(e) 
   }
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

export default router;