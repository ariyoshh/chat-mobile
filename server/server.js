const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const mongoURI = 'mongodb+srv://ariyoshh:Boasorte!23@cluster0.qgd24wo.mongodb.net/yourdatabase?retryWrites=true&w=majority';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB conectado...'))
  .catch(err => console.error('Erro ao conectar no MongoDB:', err));

const UsuarioSchema = new mongoose.Schema({
  identificador: String,
  usuario: String,
});

const MensagemSchema = new mongoose.Schema({
  msg: String,
  dataHoraMsg: Date,
  identificadorUsuarioRemetente: String,
  identificadorUsuarioDestinatario: String,
  remetente: String,
  lida: { type: Boolean, default: false },
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Mensagem = mongoose.model('Mensagem', MensagemSchema);

app.post('/iniciaChat', async (req, res) => {
  const { usuario } = req.body;
  console.log(`Tentando iniciar chat para o usuário: ${usuario}`);
  const existingUser = await Usuario.findOne({ usuario });
  if (existingUser) {
    return res.status(400).send('Usuário já está em uso');
  }
  const identificador = Math.random().toString(36).substr(2, 9);
  const newUser = new Usuario({ identificador, usuario });
  await newUser.save();
  console.log(`Usuário ${usuario} criado com identificador ${identificador}`);
  res.send({ identificador });
});

app.post('/encerraChat', async (req, res) => {
  const { identificadorUsuario } = req.body;
  console.log(`Encerrando chat para o usuário: ${identificadorUsuario}`);
  await Usuario.deleteOne({ identificador: identificadorUsuario });
  await Mensagem.deleteMany({
    $or: [
      { identificadorUsuarioRemetente: identificadorUsuario },
      { identificadorUsuarioDestinatario: identificadorUsuario }
    ]
  });
  res.send('Chat encerrado');
});

app.get('/consultaUsuarios', async (req, res) => {
  const usuarios = await Usuario.find();
  res.send(usuarios);
});

app.post('/msgAll', async (req, res) => {
  const { identificadorUsuario, msg } = req.body;
  const usuario = await Usuario.findOne({ identificador: identificadorUsuario });
  const newMessage = new Mensagem({
    msg,
    dataHoraMsg: new Date(),
    identificadorUsuarioRemetente: identificadorUsuario,
    identificadorUsuarioDestinatario: null,
    remetente: usuario ? usuario.usuario : 'Desconhecido'
  });
  await newMessage.save();
  res.send('Mensagem enviada a todos');
});

app.post('/msg', async (req, res) => {
  const { identificadorUsuario, msg, identificadorUsuarioDestino } = req.body;
  const usuario = await Usuario.findOne({ identificador: identificadorUsuario });
  const newMessage = new Mensagem({
    msg,
    dataHoraMsg: new Date(),
    identificadorUsuarioRemetente: identificadorUsuario,
    identificadorUsuarioDestinatario: identificadorUsuarioDestino,
    remetente: usuario ? usuario.usuario : 'Desconhecido'
  });
  await newMessage.save();
  res.send('Mensagem enviada ao usuário');
});

app.get('/consultaMensagens', async (req, res) => {
  const { identificadorUsuario, chatMode } = req.query;
  let mensagens;
  if (chatMode === 'geral') {
    mensagens = await Mensagem.find({ identificadorUsuarioDestinatario: null });
  } else {
    mensagens = await Mensagem.find({
      $or: [
        { identificadorUsuarioRemetente: identificadorUsuario, identificadorUsuarioDestinatario: chatMode },
        { identificadorUsuarioRemetente: chatMode, identificadorUsuarioDestinatario: identificadorUsuario }
      ]
    });
  }
  res.send(mensagens.sort((a, b) => a.dataHoraMsg - b.dataHoraMsg));
});

app.post('/limparConversas', async (req, res) => {
  const { identificadorUsuario } = req.body;
  try {
    await Mensagem.deleteMany({
      $or: [
        { identificadorUsuarioRemetente: identificadorUsuario },
        { identificadorUsuarioDestinatario: identificadorUsuario },
        { identificadorUsuarioDestinatario: null }
      ]
    });
    res.send('Mensagens do usuário removidas.');
  } catch (error) {
    res.status(500).send('Erro ao limpar as mensagens');
  }
});

app.post('/derrubarUsuarios', async (req, res) => {
  try {
    await Usuario.deleteMany({});
    await Mensagem.deleteMany({});
    res.send('Todos os usuários e mensagens foram removidos.');
  } catch (error) {
    res.status(500).send('Erro ao remover os usuários e mensagens');
  }
});

app.post('/marcaMensagensComoLidas', async (req, res) => {
  const { identificadorUsuario, chatMode } = req.body;
  try {
    await Mensagem.updateMany(
      {
        identificadorUsuarioDestinatario: identificadorUsuario,
        identificadorUsuarioRemetente: chatMode,
        lida: false
      },
      { $set: { lida: true } }
    );
    res.send('Mensagens marcadas como lidas.');
  } catch (error) {
    res.status(500).send('Erro ao marcar mensagens como lidas.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
