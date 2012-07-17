var model, view;
model = require('./chart-option-model');
view = require('./chart-option-view');
__import(__import(exports, model), view);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}