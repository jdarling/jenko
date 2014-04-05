/*
  Store(name)
    get(id, callback)
    insert(record, callback)
    update(id, record, callback)
    asArray(options, callback)
      options{
        offset: Number
        limit: Number
        filter: Object
        sort: {
          Key: Direction(1 Ascending, -1 Descending)
          ...
        }
      }
    ensure(record, callback)
*/

var config = require('../lib/config');
var storeType = config.section('store', {type: 'memory'}).type;
var _stores = {};
var Store = require('./stores/memory');

var loadStore = function(collectionName){
  return new Store(collectionName);
};

var getStore = module.exports = function(collectionName){
  return _stores[collectionName] || (_stores[collectionName] = loadStore(collectionName));
};

try{
  try{
    Store = require('./stores/'+storeType);
  }catch(e){
    try{
      Store = require(storeType);
    }catch(e){
    }
  }
}catch(e){
  console.log(storeType+' not availble falling back to in-memory store.');
  console.log(e);
  if(e.stack){
    console.log(e.stack);
  }
}
