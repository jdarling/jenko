var SocketIO = require('socket.io');
var logger = require('../lib/logger');
var io;

var Sockets = function(){
};

Sockets.prototype.init = function(server){
  var self = this;
  self.io = SocketIO.listen(server);
  self.io.on('connection', function(socket){
    socket.on('message', function(msg){
      logger.log('Message: ', msg);
      socket.broadcast.emit('message', msg);
    });
  });
};

module.exports = new Sockets();
