var Jenkins = require('../lib/jenkins');
var url = require('url');
var logger = require('../lib/logger');
//var jobs = require('../lib/store')('jobs');
var jobs = require('../lib/cache')('jobs', {}, function(id, callback){
  jenkins.job({name: id}, callback);
});
var jenkins;

var handleJenkinsAPICall = function(request, reply){
  var route = unescape(request.path.replace(/^\/api\/v1\/jenkins\/api\//, ''));
  var f = jenkins[route];
  if(!f){
    return reply('No endpoint found for '+route);
  }
  f.call(jenkins, request.query, request.payload, function(err, response){
    reply(err||response);
  });
};

var getJenkinsServer = function(request, reply){
  reply(jenkins.options.host);
};

var proxyJenkinsCall = function(request, reply){
  var route = unescape(request.path.replace(/^\/api\/v1\/jenkins\/proxy\//, ''));
  var opts = {
    uri: url.resolve(jenkins.options.host, route),
    passThrough: true
  };
  reply.proxy(opts);
};

var getSystemInfo = function(request, reply){
  jenkins.list(null, function(err, response){
    reply(err||response);
  });
};

var getJobs = function(request, reply){
  jenkins.list(null, function(err, response){
    reply(err||response.jobs);
  });
};

var getJob = function(request, reply){
  jobs.get(request.params.name, function(err, response){
    reply(err||response);
  });
  /*
  jenkins.job(request.params, function(err, response){
    reply(err||response);
  });
  */
};

var getJobBuilds = function(request, reply){
  jenkins.job(request.params, function(err, response){
    reply(err||response.builds);
  });
};

var getJobConfig = function(request, reply){
  jenkins.config(request.params, function(err, response){
    reply(err||response);
  });
};

var getJobConfigXML = function(request, reply){
  jenkins.config(request.params, function(err, response){
    reply(err||response);
  }, {raw: true});
};

var getJobBuild = function(request, reply){
  jenkins.jobBuildInfo(request.params, function(err, response){
    reply(err||response);
  });
};

var getJobBuildOutput = function(request, reply){
  jenkins.jobBuildOutput(request.params, function(err, response){
    reply(err||response);
  });
};

module.exports = function(server, config){
  jenkins = new Jenkins(config);
  server.route([
    {
      method: 'GET',
      path: config.route+'jenkins/api/{path*}',
      handler: handleJenkinsAPICall
    },
    {
      method: 'POST',
      path: config.route+'jenkins/api/{path*}',
      handler: handleJenkinsAPICall
    },
    {
      method: 'GET',
      path: config.route+'jenkins/proxy/{path*}',
      handler: proxyJenkinsCall
    },
    {
      method: 'POST',
      path: config.route+'jenkins/proxy/{path*}',
      handler: proxyJenkinsCall
    },
    {
      method: 'GET',
      path: config.route+'jenkins',
      handler: getSystemInfo
    },
    {
      method: 'GET',
      path: config.route+'jenkins/server',
      handler: getJenkinsServer
    },
    {
      method: 'GET',
      path: config.route+'jenkins/jobs',
      handler: getJobs
    },
    {
      method: 'GET',
      path: config.route+'jenkins/job/{name}',
      handler: getJob
    },
    {
      method: 'GET',
      path: config.route+'jenkins/job/{name}/builds',
      handler: getJobBuilds
    },
    {
      method: 'GET',
      path: config.route+'jenkins/job/{name}/config',
      handler: getJobConfig
    },
    {
      method: 'GET',
      path: config.route+'jenkins/job/{name}/config.xml',
      handler: getJobConfigXML
    },
    {
      method: 'GET',
      path: config.route+'jenkins/job/{name}/build/{build}',
      handler: getJobBuild
    },
    {
      method: 'GET',
      path: config.route+'jenkins/job/{name}/build/{build}/output',
      handler: getJobBuildOutput
    }
  ]);
};
