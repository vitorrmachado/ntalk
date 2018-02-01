const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const consign = require('consign');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const methodOverride = require('method-override');
const config = require('./config');
const error = require('./middlewares/errors');
const cookie=require('cookie');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const store = new expressSession.MemoryStore();

const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;
global.db	=	mongoose.connect('mongodb://localhost:27017/ntalk');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressSession({
  store,
  name: config.sessionKey,
  secret: config.sessionSecret
}));

app.use(cookieParser('ntalk'));
app.use(expressSession());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

io.use((socket, next) => {
  const cookieData = socket.request.headers.cookie;
  const cookieObj = cookie.parse(cookieData);
  const sessionHash = cookieObj[config.sessionKey] || '';
  const sessionID = sessionHash.split('.')[0].slice(2);
  store.all((err, sessions) => {
      const currentSession = sessions[sessionID];
      if (err || !currentSession) {
          return next(new Error('Acesso negado!'));
      }
      socket.handshake.session = currentSession;
      return next();
  });
});

const	onlines	=	{};
const	redis	=	require('redis').createClient();

io.on('connection', (client) => {
  const { session } = client.handshake;
  const { usuario } = session;
  /*onlines[usuario.email]	=	usuario.email;
  for	(let	email	in	onlines)	{
    client.emit('notify-onlines',	email);
    client.broadcast.emit('notify-onlines',	email);
  }*/
  redis.sadd('onlines',	usuario.email,	()	=>	{
    redis.smembers('onlines',	(err,	emails)	=>	{
        emails.forEach((email)	=>	{
            client.emit('notify-onlines',	email);
            client.broadcast.emit('notify-onlines',	email);
        });
    });
  });
  client.on('send-server',(hashSala,msg)=>{
    const novaMensagem = { email: usuario.email , sala: hashSala };
    const resposta = `<b>${usuario.nome}:</b>${msg.msg}<br>`;
    redis.lpush(hashSala,	resposta);
		client.broadcast.emit('new-message',	novaMensagem);
		io.to(hashSala).emit('send-client',	resposta);
    /*session.sala = hashDaSala;
    client.broadcast.emit('new-message', novaMensagem);
    io.to(hashDaSala).emit('send-client', resposta);*/
  });
  client.on('create-room', (hashSala) => {
    console.log(hashSala);
    session.sala = hashSala;
    client.join(hashSala);
    const	resposta	=	`<b>${usuario.nome}:</b>	entrou.<br>`;
    redis.lpush(hashSala,	resposta,	()	=>	{
      redis.lrange(hashSala,	0,	-1,	(err,	msgs)	=>	{
          msgs.forEach((msg)	=>	{
            io.to(hashSala).emit('send-client',	msg);
          });
      });
    });
  });

  client.on('disconnect', () => {
    const	{ sala }	=	session;
    const	resposta	=	`<b>${usuario.nome}:</b>	disconnected.<br>`;
    //delete	onlines[usuario.email];
    redis.srem('onlines',	usuario.email);
    redis.lpush(sala,	resposta,	()	=>	{
      session.sala	=	null;
      client.leave(sala);
      client.broadcast.emit('notify-offlines',	usuario.email);
      io.to(sala).emit('send-client',	resposta);
    });
    /*session.sala	=	null;
    client.leave(sala);
    client.broadcast.emit('notify-offlines',	usuario.email);
    io.to(sala).emit('send-client',	resposta);*/
  });
});

consign({}).include('models')
           .then('controllers')
           .then('routes')
           .into(app);

app.use(error.notFound);
app.use(error.serverError);
    
server.listen(3000, () => {
  console.log('Ntalk no ar.');
});

module.exports = app;