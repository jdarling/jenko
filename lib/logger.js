var fs = require('fs');

var Logger = function(){
  var self = this;
};

Logger.prototype.log = function(){
  var dt = new Date();
  console.log('['+dt+']');
  console.log.apply(console, arguments);
  try{
    if(self.log){
      self.log.write('['+dt+']\r\n'+Array.prototype.join.call(arguments, '\t')+'\r\n');
    }
  }catch(e){
  }
};

Logger.prototype.error = function(){
  var dt = new Date();
  console.log('['+dt+']');
  console.log.apply(console, arguments);
  try{
    if(self.log){
      self.log.write('['+dt+']\r\n'+Array.prototype.join.call(arguments, '\t')+'\r\n');
    }
  }catch(e){
  }
};

module.exports = new Logger();
