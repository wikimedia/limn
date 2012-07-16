require.define('/node_modules/limn/base.js', function(require, module, exports, __dirname, __filename, undefined){

var mixins, models, views, cache, cascading, data_binding;
exports.Base = require('limn/base/base');
mixins = require('limn/base/base-mixin');
models = require('limn/base/base-model');
views = require('limn/base/base-view');
cache = require('limn/base/model-cache');
cascading = require('limn/base/cascading-model');
data_binding = require('limn/base/data-binding');
__import(__import(__import(__import(__import(__import(exports, mixins), models), views), cache), cascading), data_binding);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
