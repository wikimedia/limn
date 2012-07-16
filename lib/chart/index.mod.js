require.define('/node_modules/limn/chart.js', function(require, module, exports, __dirname, __filename, undefined){

var chart_type, chart_option, dygraphs, d3_chart, d3_elements;
chart_type = require('limn/chart/chart-type');
chart_option = require('limn/chart/option');
dygraphs = require('limn/chart/type/dygraphs');
d3_chart = require('limn/chart/type/d3-chart');
d3_elements = require('limn/chart/type/d3');
__import(__import(__import(__import(__import(exports, chart_type), chart_option), dygraphs), d3_chart), d3_elements);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});
