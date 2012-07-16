require.define('/node_modules/limn/base/scaffold.js', function(require, module, exports, __dirname, __filename, undefined){

var models, views;
models = require('limn/base/scaffold/scaffold-model');
views = require('limn/base/scaffold/scaffold-view');
__import(__import(exports, models), views);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
