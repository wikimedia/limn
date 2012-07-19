require.define('/node_modules/limn/graph/graph-display-view.js', function(require, module, exports, __dirname, __filename, undefined){

var moment, op, Graph, GraphView, root, GraphDisplayView, _ref, _;
moment = require('moment');
_ref = require('../util'), _ = _ref._, op = _ref.op;
Graph = require('./graph-model').Graph;
GraphView = require('./graph-view').GraphView;
root = function(){
  return this;
}();
/**
 * @class View for a graph visualization encapsulating.
 */
GraphDisplayView = exports.GraphDisplayView = GraphView.extend({
  tagName: 'section',
  className: 'graph graph-display',
  template: require('../template/graph/graph-display'),
  events: {
    'focus      .graph-permalink input': 'onPermalinkFocus',
    'click      .export-button': 'exportChart'
  },
  constructor: (function(){
    function GraphDisplayView(){
      return GraphView.apply(this, arguments);
    }
    return GraphDisplayView;
  }()),
  initialize: function(o){
    o == null && (o = {});
    this.data = {};
    GraphDisplayView.__super__.initialize.apply(this, arguments);
    this.chartOptions(this.model.getOptions(), {
      silent: true
    });
    return this.loadData();
  },
  render: function(){
    if (!(this.ready && !this.isRendering)) {
      return this;
    }
    this.wait();
    this.checkWaiting();
    root.title = this.get('name') + " | Limn";
    GraphDisplayView.__super__.render.apply(this, arguments);
    this.unwait();
    this.checkWaiting();
    this.isRendering = false;
    return this;
  }
  /**
   * Exports graph as png
   */,
  exportChart: function(evt){
    var img;
    console.log(this + ".export!");
    img = this.$el.find('.export-image');
    Dygraph.Export.asPNG(this.chart, img);
    return window.open(img.src, "toDataURL() image");
  }
  /**
   * Selects the graph permalink input field.
   */,
  onPermalinkFocus: function(evt){
    var _this = this;
    return _.defer(function(){
      return _this.$('.graph-permalink input').select();
    });
  }
});

});
