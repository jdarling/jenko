var util = require('util'),
  qs = require('querystring'),
  request = require('request'),
  Handlebars = require('handlebars'),
  xml2js = require('xml2js')
  ;
/*
  Jenkins (and Hudson) expose multiple different builds, such as lastBuild, lastStableBuild, lastSuccessfulBuild, lastFailedBuild, lastUnstableBuild, lastUnsuccessfulBuild, lastCompletedBuild.
  more info: https://wiki.jenkins-ci.org/display/JENKINS/Terminology
*/
var defaultOptions = {
  host: 'https://ci.jenkins-ci.org',
  api: 'api/json',
  endpoints: {
    newJob: {
      url: '{{config.host}}/createItem/?name={{args.name}}',
      method: 'POST'
    },
    deleteJob: {
      url: '{{config.host}}/job/{{args.name}}/doDelete',
      method: 'POST'
    },
    build: {
      url: '{{config.host}}/job/{{args.name}}/build/{{config.api}}',
      method: 'POST'
    },
    disableJob: {
      url: '{{config.host}}/job/{{args.name}}/disable',
      method: 'POST'
    },
    enableJob: {
      url: '{{config.host}}/job/{{args.name}}/enable',
      method: 'POST'
    },
    buildWithParams: {
      url: '{{config.host}}/job/{{args.name}}/buildWithParameters',
      method: 'POST'
    },
    config: {
      url: '{{config.host}}/job/{{args.name}}/config.xml',
      method: 'GET'
    },
    job: {
      url: '{{config.host}}/job/{{args.name}}/{{config.api}}',
      method: 'GET'
    },
    list: {
      url: '{{config.host}}/{{config.api}}',
      method: 'GET'
    },
    lastSuccess: {
      url: '{{config.host}}/job/{{args.name}}/lastSuccessfulBuild/{{config.api}}',
      method: 'POST'
    },
    lastSuccessReport: {
      url: '{{config.host}}/job/{{args.name}}/lastSuccessfulBuild/{{args.reportName}}/{{config.api}}',
      method: 'GET'
    },
    lastBuild: {
      url: '{{config.host}}/job/{{args.name}}/lastBuild/{{config.api}}',
      method: 'GET'
    },
    lastCompletedBuild: {
      url: '{{config.host}}/job/{{args.name}}/lastCompletedBuild/{{config.api}}',
      method: 'GET'
    },
    buildReport: {
      url: '{{config.host}}/job/{{args.name}}/lastBuild/{{args.reportName}}/{{config.api}}',
      method: 'GET'
    },
    queue: {
      url: '{{config.host}}/queue/{{config.api}}',
      method: 'GET'
    },
    computer: {
      url: '{{config.host}}/computer/{{config.api}}',
      method: 'GET'
    },
    jobBuildInfo: {
      url: '{{config.host}}/job/{{args.name}}/{{args.build}}/{{config.api}}',
      method: 'GET'
    },
    jobBuildOutput: {
      url: '{{config.host}}/job/{{args.name}}/{{args.build}}/consoleText/{{config.api}}',
      method: 'GET'
    }
  }
};

/*
var buildStrFunc = function(src){
  var args = [];
  var src = src.replace(/{{(args|config)\.([^}]+)}}/g, function(sym, seg, part){
    switch(seg){
      case('args'):
        if(args.indexOf(part)===-1){
          args.push(part);
        }
        return "'+"+part+"+'";
      case('config'):
        return "'+self.options."+part+"+'";
    }
    return sym;
  });
  src = ("'"+src+"'").replace("''+", '').replace("+''", '')+';';
  src = '  var self = this;\r\n  return '+src;
  return new Function(args, src);
};
*/

var getArgs = function(from){
  var expect = [];
  var reGetArg = /{{args\.([^}]+)}}/g;
  var match;
  while(match = reGetArg.exec(from)){
    expect.push(match[1]);
  }
  return expect;
};

var isObject = function(obj){
  return obj === Object(obj);
};

var isArray = function(arr){
  return arr instanceof Array;
};

var each = function(obj, ittr, ctx){
  if(obj == null){
    return obj;
  }
  if(obj.forEach){ // its an array or an object with forEach
    obj.forEach(ittr, ctx);
  }else{
    var keys = Object.keys(obj), key;
    var i, l=keys.length;
    for(i=0; i<l; i++){
      key = keys[i];
      if(ittr.call(ctx, obj[key], key, obj)==={}){
        return;
      }
    }
  }
  return obj;
};

var defaultTo = function(src, defaults){
  each(defaults, function(val, key){
    if(isObject(src[key])&&isObject(defaults[key])){
      if(!isArray(src[key])){
        src[key] = defaultTo(src[key], defaults[key]);
      }
    }else{
      src[key] = src[key] || val;
    }
  });
  return src;
};

var Jenkins = module.exports = function(options){
  var self = this;
  self.options = defaultTo(options||{}, defaultOptions);
  each(self.options.endpoints, function(src, name){
    var method = src.method || 'GET';
    var url = src.url||src;
    var f = Handlebars.compile(url);
    self[name] = (function(url, template, method, expect){
      var f = function(args, body, callback, options){
        if(typeof(body)=='function'){
          options = callback;
          callback = body;
          body = false;
        }
        options = options || {};
        f.validateArgs(args, function(errs){
          if(errs){
            return callback('Missing: '+errs.join(', '));
          }else if(options.raw){
            return self.makeRawCall(method, template, args, body, callback);
          }else{
            return self.makeCall(method, template, args, body, callback);
          }
        });
      };
      f.url = url;
      f.args = expect;
      f.validateArgs = function(args, callback){
        var i, l=expect.length, key, missing=[], undefined;
        for(i=0; i<l; i++){
          key = expect[i];
          if(args[key]===undefined){
            missing.push(key);
          }
        }
        process.nextTick(function(){
          if(missing.length){
            return callback(missing, false);
          }else{
            return callback(null, true);
          }
        });
      };
      return f;
    })(url, f, method, getArgs(url));
  });
};

Jenkins.Defaults = defaultOptions;

Jenkins.prototype.fmt = function(str, args){
  var self = this;
  var pkt = {
    config: self.options,
    args: args
  };
  var template = Handlebars.compile(str);
  return template(pkt);
};

Jenkins.prototype.getEndpoint = function(path, args){
  var self = this;
  if(typeof(path)=='string'){
    return self.fmt(path, args);
  }else{
    return path({
        config: self.options,
        args: args
      });
  }
};

Jenkins.prototype.makeRawCall = function(method, url, args, body, callback){
  var self = this;
  var endpoint = self.getEndpoint(url, args);
  var data;
  var opts = {
    method: method.toUpperCase(),
    url: endpoint
  };
  if(typeof(body)==='function'){
    callback = body;
    body = '';
  }
  if(opts.method=='POST'||opts.method=='PUT'){
    if(typeof(body)=='string'){
      opts.body = body;
      opts.headers = { "content-type": "application/xml"};
    }else if(typeof(body)=='object'){
      opts.body = JSON.stringify(body);
      opts.headers = { "content-type": "application/json"};
    }
  }
  request(opts, function(error, response, body) {
      if ( error || response.statusCode !== 200 ) {
          callback(error || body, response);
          return;
      }
      return callback(error, body);
  });
};

Jenkins.prototype.makeCall = function(method, url, args, body, callback){
  var self = this;
  if(typeof(body)==='function'){
    callback = body;
    body = '';
  }
  self.makeRawCall(method, url, args, body, function(err, body){
    if(err){
      callback(err, body);
    }
    try{
      data = JSON.parse(body.toString());
      return callback(null, data);
    }catch(e){
      return xml2js.parseString(body.toString(), function(err, result){
        if(err){
          return callback(null, body);
        }else{
          return callback(null, result);
        }
      });
    }
  });
};
