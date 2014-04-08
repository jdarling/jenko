var Store = require('../lib/store');
var async = require('async');
var config = require('../lib/config').section('cache', {refreshRate: 5000, concurrency: 5});
var logger = require('../lib/logger');

var _caches = {};

module.exports = function(name, options, updateCallback){
  return _caches[name] = _caches[name] || new Cache(name, options, updateCallback);
};


/*-- Begin Equal code --*/
// From http://stamat.wordpress.com/2013/06/22/javascript-object-comparison/

//Returns the object's class, Array, Date, RegExp, Object are of interest to us
var getClass = function(val) {
	return Object.prototype.toString.call(val)
		.match(/^\[object\s(.*)\]$/)[1];
};
 
//Defines the type of the value, extended typeof
var whatis = function(val) {
 
	if (val === undefined)
		return 'undefined';
	if (val === null)
		return 'null';
 
	var type = typeof val;
 
	if (type === 'object')
		type = getClass(val).toLowerCase();
 
	if (type === 'number') {
		if (val.toString().indexOf('.') > 0)
			return 'float';
		else
			return 'integer';
	}
 
	return type;
};
 
var compareObjects = function(a, b, except) {
	if (a === b)
		return true;
  var doTest;
	for (var i in a) {
    doTest = !except;
    if(!doTest){
      doTest = except.indexOf(i) == -1;
    }
    if(doTest){
      if (b.hasOwnProperty(i)) {
        if (!equal(a[i],b[i])) return false;
      } else {
        return false;
      }
    }
	}
 
	for (var i in b) {
    doTest = !except;
    if(!doTest){
      doTest = except.indexOf(i) == -1;
    }
    if(doTest){
      if (!a.hasOwnProperty(i)) {
        return false;
      }
    }
	}
	return true;
};
 
var compareArrays = function(a, b) {
	if (a === b)
		return true;
	if (a.length !== b.length)
		return false;
	for (var i = 0; i < a.length; i++){
		if(!equal(a[i], b[i])) return false;
	};
	return true;
};
 
var _equal = {};
_equal.array = compareArrays;
_equal.object = compareObjects;
_equal.date = function(a, b) {
	return a.getTime() === b.getTime();
};
_equal.regexp = function(a, b) {
	return a.toString() === b.toString();
};
//	uncoment to support function as string compare
//	_equal.fucntion =  _equal.regexp;
 
 
 
/*
 * Are two values equal, deep compare for objects and arrays.
 * @param a {any}
 * @param b {any}
 * @return {boolean} Are equal?
 */
var equal = function(a, b, ignore) {
	ignore = ignore || [];
  if (a !== b) {
		var atype = whatis(a), btype = whatis(b);
 
		if (atype === btype)
			return _equal.hasOwnProperty(atype) ? _equal[atype](a, b, ignore) : a==b;
 
		return false;
	}
 
	return true;
};
/*-- End Equal code --*/

var Cache = function(name, options, updateCallback){
  var self = this;
  if(typeof(options)=='function'){
    updateCallback = options;
    options = false;
  }
  self.store = Store(name);
  self.options = options || {};
  self.updateCallback = updateCallback;
  self.update();
};

Cache.prototype.get = function(id, callback){
  var self = this;
  self.store.get(id, function(err, record){
    if(record && record.root){
      record = record[record.root];
    }
    if(!record){
      logger.log('Missing: ', id, 'fetching it');
      self.updateCallback(id, function(err, record){
        record.id = id;
        logger.log('got it: ', id);
        self.store.insert(record, function(err, record){
          callback(err, record);
        });
      });
    }else{
      callback(err, record);
    }
  });
};

Cache.prototype.update = function(){
  var self = this;
  var done = function(){
    self._tmr = setTimeout(function(){
      self.update();
    }, config.refreshRate);
  };
  clearTimeout(self._tmr);
  self.store.asArray({}, function(err, records){
    if(records){
      if(records.root){
        records = records[records.root];
      }
      async.eachLimit(records, config.concurrency, function(record, next){
        self.updateCallback(record._id, function(err, update){
          if(err){
            logger.log(err);
            return next();
          }
          if(equal(record, update, ['_updated', '_created', '_id', 'id'])){
            next();
          }else if(update){
            logger.log('Record:', record._id, 'updated');
            self.store.update(record._id, update, function(){
              next();
            });
          }else{
            logger.log('Record:', record._id, 'no update received');
            next();
          }
        });
      }, done);
    }else{
      process.nextTick(done);
    }
  });
};
