/**
 * Module Dependencies
 */
var express = require('express'),
    app = express();
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(logErrors);
  app.use(clientErrorHandler);
  app.use(errorHandler);
  //app.use(assetsManagerMiddleware);
  app.use(express.static(__dirname + '/public')); 
});

io.set('log level', 1);

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
}); 

app.get('/', function(req, res){
  var ua = req.header('user-agent');
  console.log(ua);
  res.render('index', {
    title: 'Home'
  });
});

server.listen(8080);
console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);

var userCount = 0;
var points = [];
io.sockets.on('connection', function (socket) {
  userCount++;       
  console.log('socket connected... userCountUpdate: ' + userCount);
  socket.emit('userCountUpdate', {count: userCount});
  socket.broadcast.emit('userCountUpdate', {count: userCount});
  socket.emit('pointsUpdate', {pointsCollection: points});
  socket.broadcast.emit('pointsUpdate', {pointsCollection: points});
  
  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.on('addPoint', function (data) {
    console.log('point received...' + data.x + ', ' + data.y);
    points.push(data);
    socket.emit('pointsUpdate', {pointsCollection: points});
    socket.broadcast.emit('pointsUpdate', {pointsCollection: points});
    console.log('update points sent...');
  });

  socket.on('disconnect', function () {
    userCount--;  
    console.log('socket disconnected... userCountUpdate: ' + userCount);
    socket.emit('userCountUpdate', {count: userCount}); 
  });
});