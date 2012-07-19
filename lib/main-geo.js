var Seq, d3, ColorBrewer, infobox, feature, map, data, width, height, fill, quantize, move, projection, path, zoom, spinner, main;
Seq = require('seq');
d3 = require('d3');
ColorBrewer = require('colorbrewer');
data = map = feature = infobox = null;
width = 960;
height = 500;
fill = d3.scale.log().domain([1, 10000]).range(["black", "red"]);
quantize = function(d){
  if (data[d.properties.name] != null) {
    return fill(data[d.properties.name]['editors']);
  } else {
    return fill("rgb(0,0,0)");
  }
};
move = function(){
  projection.translate(d3.event.translate).scale(d3.event.scale);
  return feature.attr("d", path);
};
projection = d3.geo.mercator().scale(width).translate([width / 2, height / 2]);
path = d3.geo.path().projection(projection);
zoom = d3.behavior.zoom().translate(projection.translate()).scale(projection.scale()).scaleExtent([height, height * 8]).on("zoom", move);
spinner = function(overrides){
  var opts;
  overrides == null && (overrides = {});
  opts = __import({
    lines: 11,
    length: 4,
    width: 1,
    radius: 18,
    rotate: -10.5,
    trail: 50,
    opacity: 1 / 4,
    shadow: false,
    speed: 1,
    zIndex: 2e9,
    color: '#333',
    top: 'auto',
    left: 'auto',
    className: 'spinner',
    fps: 20,
    hwaccel: Modernizr.csstransforms3d
  }, overrides);
  return jQuery('.geo-spinner').show().spin(opts);
};
spinner();
main = function(){
  var setInfoBox, worldmap;
  map = d3.select('#worldmap').append("svg:svg").attr("width", width).attr("height", height).append("svg:g").attr("transform", "translate(0,0)").call(zoom);
  feature = map.selectAll(".feature");
  map.append("svg:rect").attr("class", "frame").attr("width", width).attr("height", height);
  infobox = d3.select('#infobox');
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
  worldmap = function(){
    return d3.json("/data/geo/maps/world-countries.json", function(json){
      return feature = feature.data(json.features).enter().append("svg:path").attr("class", "feature").attr("d", path).attr("fill", quantize).attr("id", function(d){
        return d.properties.name;
      }).on("mouseover", setInfoBox).on("mouseout", function(){
        return infobox.style("display", "none");
      });
    });
  };
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
jQuery(main);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}