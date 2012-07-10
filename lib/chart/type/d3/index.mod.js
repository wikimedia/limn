require.define('/node_modules/kraken/chart/type/d3/index.js.js', function(require, module, exports, __dirname, __filename, undefined){

var d3chart, line, bar;
d3chart = require('kraken/chart/type/d3/d3-chart-element');
line = require('kraken/chart/type/d3/d3-line-element');
bar = require('kraken/chart/type/d3/d3-bar-element');
__import(__import(__import(exports, line), bar), d3chart);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
