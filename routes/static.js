//var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var reHTML = /^.*(\/|\.html)$/i;
var webroot = './webroot';
var Hapi = require('hapi');
//var FileResponse = Hapi.response.File;
var async = require('async');

var getFileName = function(base){
  return base.replace(/\/$/, '/index.html');
};

var getFileExtension = module.exports.getExtension = function(filename) {
    var ext = path.extname(filename||'').split('.');
    return ext[ext.length - 1];
};

var fetchFile = function(fileName, callback){
  fs.readFile(webroot+fileName, callback);
};

var processStaticHTML = function(fileName, source, reply){
  var ceResult = cheerio.load(source);
  var reHTML = /^.*\.html$/i;
  var list = ceResult('[src],[data-src]');
  if(list.length){
    async.each(list, function(item, next){
      item = ceResult(item);
      var source = item.attr('src')||item.data('src');
      if(reHTML.exec(source)){
        fetchFile(source, function(err, fileSource){
          if(!item.attr('no-cheerio')){
            processStaticHTML(source, (fileSource||err).toString(), function(err, fileSource){
              item.removeAttr('src');
              item.removeAttr('data-src');
              item.html(fileSource);
              next();
            });
          }else{
              item.removeAttr('no-cheerio');
              item.removeAttr('src');
              item.html(fileSource);
              next();
          }
        });
      }else{
        next();
      }
    }, function(){
      var html = ceResult.html();
      if(typeof(reply)==='function'){
        reply(null, html);
      }else{
        reply.reply(html);
      }
    });
  }else{
    if(typeof(reply)==='function'){
      reply(null, source);
    }else{
      reply.reply(source);
    }
  }
};

var getLocalFile = function(request, reply){
  var fileName = unescape(getFileName(request.path));
  var isHTML = getFileExtension(fileName).toLowerCase() === 'html';
  if(isHTML){
    fetchFile(fileName, function(err, source){
      if(err){
        reply.file(webroot+fileName);
        //request.reply(new FileResponse(webroot+fileName));
      }else{
        reply.file(webroot+fileName);
        //processStaticHTML(fileName, source.toString(), reply);
      }
    });
  }else{
    console.log(webroot + fileName);
    reply.file(webroot+fileName);
    //request.reply(new FileResponse(webroot+fileName));
  }
};

module.exports = function(server, config){
	// Serve static files from `webroot` dir.
	server.route({
		method: 'GET',
		path: '/{path*}',
    handler: getLocalFile
/*
  handler: {
				directory: { path: './webroot', listing: false, index: true }
		}
*/
	});
};