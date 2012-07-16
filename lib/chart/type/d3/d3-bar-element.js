var d3, op, D3ChartElement, root, BarChartType, _ref, _, _fmt;
d3 = require('d3');
_ref = require('limn/util'), _ = _ref._, op = _ref.op;
D3ChartElement = require('limn/chart/type/d3/d3-chart-element').D3ChartElement;
_fmt = require('limn/util/formatters');
root = function(){
  return this;
}();
exports.BarChartType = BarChartType = (function(superclass){
  BarChartType.displayName = 'BarChartType';
  var prototype = __extend(BarChartType, superclass).prototype, constructor = BarChartType;
  prototype.__bind__ = [];
  prototype.SPEC_URL = '/schema/d3/d3-bar.json';
  prototype.chartElement = 'd3-bar';
  D3ChartElement.register(BarChartType);
  function BarChartType(){
    superclass.apply(this, arguments);
  }
  prototype.renderChartElement = function(metric, svgEl, xScale, yScale){
    var X, Y, metricBars, data, barWidth, barHeight, chT;
    X = function(d, i){
      return xScale(d[0]);
    };
    Y = function(d, i){
      return yScale(d[1]);
    };
    metricBars = root.metricBars = svgEl.append("g").attr("class", "metric bars " + metric.get('label'));
    data = d3.zip(metric.getDateColumn(), metric.getData());
    barWidth = svgEl.attr('width') / data.length;
    barHeight = function(d){
      return svgEl.attr('height') - Y(d);
    };
    metricBars.selectAll("bar").data(data).enter().append("rect").attr("class", function(d, i){
      return "metric bar " + i;
    }).attr("x", X).attr("y", Y).attr("height", barHeight).attr("width", barWidth).attr("fill", metric.get('color')).attr("stroke", "white").style("opacity", "0.4").style("z-index", -10);
    chT = this;
    metricBars.selectAll(".metric.bar").on("mouseover", function(d, i){
      return svgEl.append("text").attr("class", "mf").attr("dx", 50).attr("dy", 100).style("font-size", "0px").transition().duration(800).text("Uh boy, the target would be:  " + _fmt.numberFormatter(d[1]).toString()).style("font-size", "25px");
    }).on("mouseout", function(d, i){
      return svgEl.selectAll(".mf").transition().duration(300).text("BUMMER!!!").style("font-size", "0px").remove();
    });
    return svgEl;
  };
  return BarChartType;
}(D3ChartElement));
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}