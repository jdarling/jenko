(function(global){
  var containerIdx = 0;
  var helpers = global.handlebarsHelpers = {
    JSONstringify: function(data){
      return JSON.stringify(data, null, '  ');
    },
    isComplex: function(obj){
      if(typeof(obj)==='object'){
        return true;
      }
      return false;
    },
    ifComplex: function(obj, options){
      if(typeof(obj)==='object'){
        return options.fn(this);
      }
      return options.inverse(this);
    },
    notPrivate: function(data, options){
      var res = {}, key;
      for(key in data){
        if(key.substr(0,1)!=='_'){
          res[key] = data[key];
        }
      }
      return options.fn(res);
    },
    keys: function(what, options){
      return options.fn(Object.keys(what));
    },
    eachKeys: function(what, options){
      var keys = Object.keys(what||{});
      var ret = '';
      keys.forEach(function(key){
        ret += options.fn({key: key, value: what[key]});
      });
      return ret;
    },
    getval: function(from, key, def){
      return from[key]||def||'';
    },
    properCase: function(val){
      var result = (val||'').replace( /([A-Z])/g, " $1");
      var finalResult = result.charAt(0).toUpperCase() + result.slice(1);
      return finalResult;
    },
    embed: function(name, scope){
      //var template = Handlebars.partials[name];
      var id = 'component_'+(containerIdx++);
      var controllerName = el('#'+name).getAttribute('data-controller');
      if(controllerName){
        var html = '<div id="'+id+'"></div>';
        setTimeout((function(id, controllerName, scope){
          return function(){
            var pane = el('#'+id);
            controllers.create(pane, controllerName, {data: scope, template: el('#'+name).innerHTML});
          }
        })(id, controllerName, scope), 10);
        //})(id, controllerName, scope, template(scope, {helpers: handlebarsHelpers})), 10);
      }else{
        html = template(scope, {helpers: handlebarsHelpers});
      }
      return new Handlebars.SafeString(html);
    }
  };
  var key;
  for(key in Handlebars.helpers){
    helpers[key] = helpers[key] || Handlebars.helpers[key];
  }
})(this);