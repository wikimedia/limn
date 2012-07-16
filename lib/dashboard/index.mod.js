require.define('/node_modules/limn/dashboard.js', function(require, module, exports, __dirname, __filename, undefined){

var models, views;
models = require('limn/dashboard/dashboard-model');
views = require('limn/dashboard/dashboard-view');
__import(__import(exports, models), views);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
