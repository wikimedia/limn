var ColorBrewer, op, ChartType, GeoWorldChartType, data, main, _ref, _;
ColorBrewer = require('colorbrewer');
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
ChartType = require('kraken/chart/chart-type').ChartType;
exports.GeoWorldChartType = GeoWorldChartType = (function(superclass){
  GeoWorldChartType.displayName = 'GeoWorldChartType';
  var prototype = __extend(GeoWorldChartType, superclass).prototype, constructor = GeoWorldChartType;
  prototype.__bind__ = ['dygNumberFormatter', 'dygNumberFormatterHTML'];
  prototype.SPEC_URL = '/schema/d3/d3-geo-world.json';
  prototype.typeName = 'd3-geo-world';
  ChartType.register(GeoWorldChartType);
  /**
   * Hash of role-names to the selector which, when applied to the view,
   * returns the correct element.
   * @type Object
   */
  prototype.roles = {
    viewport: '.viewport',
    legend: '.graph-legend'
  };
  function GeoWorldChartType(){
    superclass.apply(this, arguments);
  }
  prototype.transform = function(){
    var options;
    options = __import(this.model.getOptions(), this.determineSize());
    if (options.colors.scaleDomain != null) {
      options.colors.scaleDomain = d3.extent;
    }
    return options;
  };
  prototype.getProjection = function(type){
    switch (type) {
    case 'mercator':
    case 'albers':
    case 'albersUsa':
      return d3.geo[type]();
    case 'azimuthalOrtho':
      return d3.geo.azimuthal().mode('orthographic');
    case 'azimuthalStereo':
      return d3.geo.azimuthal().mode('stereographic');
    default:
      throw new Error("Invalid map projection type '" + type + "'!");
    }
  };
  prototype.renderChart = function(data, viewport, options, lastChart){
    var width, height, fill, quantize, projection, path, feature, infobox, move, zoom, chart, setInfoBox, worldmap;
    width = options.width, height = options.height;
    fill = this.fill = function(data, options){
      return d3.scale[options.colors.scale]().domain(options.colors.scaleDomain).range(options.colors.palette);
    };
    quantize = this.quantize = function(data, options){
      return function(d){
        if (data[d.properties.name] != null) {
          return fill(data[d.properties.name].editors);
        } else {
          return fill("rgb(0,0,0)");
        }
      };
    };
    projection = this.projection = this.getProjection(options.map.projection).scale(width).translate([width / 2, height / 2]);
    path = d3.geo.path().projection(projection);
    feature = map.selectAll(".feature");
    infobox = d3.select('.infobox');
    move = function(){
      projection.translate(d3.event.translate).scale(d3.event.scale);
      return feature.attr("d", path);
    };
    zoom = d3.behavior.zoom().translate(projection.translate()).scale(projection.scale()).scaleExtent([height, height * 8]).on("zoom", move);
    chart = d3.select(viewport[0]).append("svg:svg").attr("width", width).attr("height", height).append("svg:g").attr("transform", "translate(0,0)").call(zoom);
    map.append("svg:rect").attr("class", "frame").attr("width", width).attr("height", height);
    infobox.select('#ball').append("svg:svg").attr("width", "100%").attr("height", "20px").append("svg:rect").attr("width", "60%").attr("height", "20px").attr("fill", '#f40500');
    setInfoBox = function(d){
      var name, ae, e5, e100, xy;
      name = d.properties.name;
      ae = 0;
      e5 = 0;
      e100 = 0;
      if (data[name] != null) {
        ae = parseInt(data[name].editors);
        e5 = parseInt(data[name].editors5);
        e100 = parseInt(data[name].editors100);
      }
      infobox.select('#country').text(name);
      infobox.select('#ae').text(ae);
      infobox.select('#e5').text(e5 + " (" + (100.0 * e5 / ae).toPrecision(3) + "%)");
      infobox.select('#e100').text(e100 + " (" + (100.0 * e100 / ae).toPrecision(3) + "%)");
      xy = d3.svg.mouse(this);
      infobox.style("left", xy[0] + 'px');
      infobox.style("top", xy[1] + 'px');
      return infobox.style("display", "block");
    };
    return worldmap = function(){
      return d3.json("/data/geo/maps/world-countries.json", function(json){
        return feature = feature.data(json.features).enter().append("svg:path").attr("class", "feature").attr("d", path).attr("fill", quantize).attr("id", function(d){
          return d.properties.name;
        }).on("mouseover", setInfoBox).on("mouseout", function(){
          return infobox.style("display", "none");
        });
      });
    };
  };
  return GeoWorldChartType;
}(ChartType));
data = null;
main = function(){
  return jQuery.ajax({
    url: "/data/geo/data/en_geo_editors.json",
    dataType: 'json',
    success: function(res){
      data = res;
      jQuery('.geo-spinner').spin(false).hide();
      worldmap();
      return console.log('Loaded geo coding map!');
    },
    error: function(err){
      return console.error(err);
    }
  });
};
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}