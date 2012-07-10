require.define('/node_modules/kraken/chart/type/d3/d3-line-element.js.js', function(require, module, exports, __dirname, __filename, undefined){

var d3, ColorBrewer, op, D3ChartElement, root, LineChartElement, _ref, _, _fmt;
d3 = require('d3');
ColorBrewer = require('colorbrewer');
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
D3ChartElement = require('kraken/chart/type/d3/d3-chart-element').D3ChartElement;
_fmt = require('kraken/util/formatters');
root = function(){
  return this;
}();
exports.LineChartElement = LineChartElement = (function(superclass){
  LineChartElement.displayName = 'LineChartElement';
  var prototype = __extend(LineChartElement, superclass).prototype, constructor = LineChartElement;
  prototype.__bind__ = [];
  prototype.SPEC_URL = '/schema/d3/d3-line.json';
  prototype.chartElement = 'd3-line';
  D3ChartElement.register(LineChartElement);
  function LineChartElement(){
    superclass.apply(this, arguments);
  }
  prototype.renderChartElement = function(metric, svgEl, xScale, yScale){
    var X, Y, line, metricLine, data, lens, gLens, gInner;
    X = function(d, i){
      return xScale(d[0]);
    };
    Y = function(d, i){
      return yScale(d[1]);
    };
    line = d3.svg.line().x(X).y(Y);
    metricLine = root.metricLine = svgEl.append("g").attr("class", "g metric line " + metric.get('label'));
    data = d3.zip(metric.getDateColumn(), metric.getData());
    metricLine.selectAll("path.line").data(d3.zip(data.slice(0, -1), data.slice(1))).enter().append("path").attr("d", line).attr("class", function(d, i){
      return "metric line segment " + i;
    }).style("stroke", metric.getColor('color'));
    lens = root.lens = svgEl.selectAll("g.lens").data([[]]);
    gLens = lens.enter().append("g").attr("class", "lens").style("z-index", 1e9);
    gInner = gLens.append("g").attr("transform", "translate(1.5em,0)");
    gInner.append("circle").attr("r", "1.5em").style("fill", "rgba(255, 255, 255, 0.4)").style("stroke", "white").style("stroke-width", "3px");
    gInner.append("text").attr("y", "0.5em").attr("text-anchor", "middle").style("fill", "black").style("font", "12px Helvetica").style("font-weight", "bold");
    metricLine.selectAll(".line.segment").on("mouseover", function(d, i){
      var color, r, g, b, lineX, lineY, lens, _ref;
      _ref = color = d3.rgb(metric.getColor('color')), r = _ref.r, g = _ref.g, b = _ref.b;
      lineX = (X(d[0]) + X(d[1])) / 2;
      lineY = (Y(d[0]) + Y(d[1])) / 2;
      lens = svgEl.select("g.lens").attr("transform", "translate(" + lineX + ", " + lineY + ")");
      lens.select("circle").style("fill", "rgba(" + r + ", " + g + ", " + b + ", 0.4)");
      return lens.select("text").text(function(){
        return _fmt.numberFormatter(d[0][1]).toString();
      });
    });
    return svgEl;
  };
  return LineChartElement;
}(D3ChartElement));
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});
