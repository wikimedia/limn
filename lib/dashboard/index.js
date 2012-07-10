var models, views;
models = require('kraken/dashboard/dashboard-model');
views = require('kraken/dashboard/dashboard-view');
__import(__import(exports, models), views);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}