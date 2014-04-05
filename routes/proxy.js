var Hapi = require('hapi');
var Joi = require('joi');

var routeConfig = {
  description: "Used to proxy a request from the client to an external endpoint.",
  validate: {
    query: Joi.object({url: Joi.string().required() }).options({allowUnknown: true})
  },
  handler: {
    proxy: {
      mapUri: function(req, cb){
        cb(null, req.query.url);
      }
    }
  }
};

module.exports = function(server, config){
	server.route([
    {
      method: 'GET',
      path: config.route + 'proxy',
      config: routeConfig
    },
    {
      method: 'POST',
      path: config.route + 'proxy',
      config: routeConfig
    },
    {
      method: 'PUT',
      path: config.route + 'proxy',
      config: routeConfig
    },
    {
      method: 'DELETE',
      path: config.route + 'proxy',
      config: routeConfig
    },
  ]);
};