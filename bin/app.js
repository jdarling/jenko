var fs = require('fs');
var Hapi = require('hapi');
var util = require('util');
var Handlebars = require('handlebars');
var path = require('path');
var config = require('../lib/config').config;
var apiConfig = config.api;
var routesPath = path.resolve(config.routesPath||'./routes/');
var sockets = require('../lib/sockets');

var PORT = process.env.VMC_APP_PORT || config.web.port || 8080;
var server = new Hapi.Server(PORT, {
    views: {
      path: 'partials',
      engines: {
        html: 'handlebars'
      }
    }
  });

fs.readdir(routesPath, function(err, files){
  if(err){
    console.log(err);
  }else{
    var i=0, l=files.length, fileName, Router;
    var reIsJSFile = /\.js$/i;
    for(i=0; i<l; i++){
      fileName = files[i];
      if(fileName.match(reIsJSFile) ){
        try{
          var section = fileName.replace(/\.js$/i, '').toLowerCase();
          var cfg = config[section]||{};
          cfg.route = cfg.route || apiConfig.route;
          console.log('Loading module: ', fileName);
          require('../routes/'+fileName)(server, cfg, sockets);
        }catch(e){
          console.log('Error loading: '+fileName);
          console.log(e.stack||e);
        }
      }
    }
  }
});

var started = function(){
  sockets.init(server.listener);
  console.log("Example.com website on http://localhost:%s", PORT);
};

server.start(started);
