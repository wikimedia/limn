require.define('/node_modules/kraken/chart/index.js.js', function(require, module, exports, __dirname, __filename, undefined){

var chart_type, chart_option, dygraphs, d3_chart, d3_elements;
chart_type = require('kraken/chart/chart-type');
chart_option = require('kraken/chart/option');
dygraphs = require('kraken/chart/type/dygraphs');
d3_chart = require('kraken/chart/type/d3-chart');
d3_elements = require('kraken/chart/type/d3');
__import(__import(__import(__import(__import(exports, chart_type), chart_option), dygraphs), d3_chart), d3_elements);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
