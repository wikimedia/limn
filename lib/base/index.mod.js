require.define('/node_modules/limn/base/index.js', function(require, module, exports, __dirname, __filename, undefined){

var mixins, models, views, cache, cascading, data_binding;
exports.Base = require('./base');
mixins = require('./base-mixin');
models = require('./base-model');
views = require('./base-view');
cache = require('./model-cache');
cascading = require('./cascading-model');
data_binding = require('./data-binding');
__import(__import(__import(__import(__import(__import(exports, mixins), models), views), cache), cascading), data_binding);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
