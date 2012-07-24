var EventEmitter, op, event, root, limn, emitter, k, Backbone, BaseView, BaseModel, BaseList, ChartType, DygraphsChartType, Graph, GraphList, GraphDisplayView, GraphEditView, GraphListView, DashboardView, Dashboard, LimnApp, _ref, _, _i, _len;
EventEmitter = require('events').EventEmitter;
_ref = require('./util'), _ = _ref._, op = _ref.op, event = _ref.event, root = _ref.root;
limn = exports;
emitter = limn.__emitter__ = new event.ReadyEmitter();
for (_i = 0, _len = (_ref = ['on', 'addListener', 'off', 'removeListener', 'emit', 'trigger', 'once', 'removeAllListeners']).length; _i < _len; ++_i) {
  k = _ref[_i];
  limn[k] = emitter[k].bind(emitter);
}
limn.mount = function(path){
  var mnt, _ref;
  mnt = ((_ref = limn.config) != null ? _ref.mount : void 8) || '/';
  return (mnt !== '/' ? mnt : '') + path;
};
Backbone = require('backbone');
_ref = limn.base = require('./base'), BaseView = _ref.BaseView, BaseModel = _ref.BaseModel, BaseList = _ref.BaseList;
_ref = limn.chart = require('./chart'), ChartType = _ref.ChartType, DygraphsChartType = _ref.DygraphsChartType;
_ref = limn.graph = require('./graph'), Graph = _ref.Graph, GraphList = _ref.GraphList, GraphDisplayView = _ref.GraphDisplayView, GraphEditView = _ref.GraphEditView, GraphListView = _ref.GraphListView;
_ref = limn.dashboard = require('./dashboard'), DashboardView = _ref.DashboardView, Dashboard = _ref.Dashboard;
/**
 * @class Sets up root application, automatically attaching to an existing element
 *  found at `appSelector` and delegating to the appropriate view.
 * @extends Backbone.Router
 */
LimnApp = limn.LimnApp = Backbone.Router.extend({
  appSelector: '#content .inner',
  routes: {
    'graphs/(new|edit)': 'newGraph',
    'graphs/:graphId/edit': 'editGraph',
    'graphs/:graphId': 'showGraph',
    'graphs': 'listGraphs',
    'dashboards/(new|edit)': 'newDashboard',
    'dashboards/:dashId/edit': 'editDashboard',
    'dashboards/:dashId': 'showDashboard',
    'dashboards': 'listDashboards'
  }
  /**
   * @constructor
   */,
  constructor: (function(){
    function LimnApp(config){
      var that;
      this.config = config != null
        ? config
        : {};
      if (that = config.appSelector) {
        this.appSelector = that;
      }
      this.el = config.el || (config.el = jQuery(this.appSelector)[0]);
      this.$el = jQuery(this.el);
      Backbone.Router.call(this, config);
      return this;
    }
    return LimnApp;
  }()),
  initialize: function(){
    var _this = this;
    jQuery(function(){
      return _this.setup();
    });
    return this;
  },
  setup: function(){
    this.route(/^(?:[\?].*)?$/, 'home');
    return Backbone.history.start({
      pushState: true,
      root: this.config.mount
    });
  },
  processData: function(id, data){
    data == null && (data = {});
    if (!(id && _(['edit', 'new']).contains(id))) {
      data.id = data.slug = id;
    }
    return data;
  }
  /* * * *  Routes  * * * */,
  home: function(){
    return this.showDashboard('reportcard');
  },
  createGraphModel: function(id){
    var data, graph;
    data = this.processData(id);
    return graph = new Graph(data, {
      parse: true
    });
  },
  newGraph: function(){
    return this.editGraph();
  },
  editGraph: function(id){
    this.model = this.createGraphModel(id);
    return this.view = new GraphEditView({
      model: this.model
    }).attach(this.el);
  },
  showGraph: function(id){
    if (_(['new', 'edit']).contains(id)) {
      return this.editGraph(id);
    }
    this.model = this.createGraphModel(id);
    return this.view = new GraphDisplayView({
      model: this.model
    }).attach(this.el);
  },
  listGraphs: function(){
    this.collection = new GraphList();
    return this.view = new GraphListView({
      collection: this.collection
    }).attach(this.el);
  },
  createDashboardModel: function(id){
    var data, dashboard;
    data = this.processData(id);
    return dashboard = new Dashboard(data, {
      parse: true
    });
  },
  newDashboard: function(){
    return console.error('newDashboard!?');
  },
  editDashboard: function(id){
    return console.error('editDashboard!?');
  },
  showDashboard: function(id){
    if (_(['new', 'edit']).contains(id)) {
      return this.editDashboard(id);
    }
    this.model = this.createDashboardModel(id);
    return this.view = new DashboardView({
      model: this.model
    }).attach(this.el);
  },
  listDashboards: function(){
    return console.error('listDashboards!?');
  },
  getClassName: function(){
    return (this.constructor.name || this.constructor.displayName) + "";
  },
  toString: function(){
    return this.getClassName() + "()";
  }
});
__import(LimnApp, {
  findConfig: function(){
    var config;
    config = root.limn_config || {};
    config.mount || (config.mount = "/");
    return config;
  },
  main: (function(){
    function limnMain(){
      var config;
      config = limn.config || (limn.config = LimnApp.findConfig());
      if (!config.libOnly) {
        limn.app || (limn.app = new LimnApp(config));
      }
      return limn.emit('main', limn.app);
    }
    return limnMain;
  }())
});
jQuery(LimnApp.main);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}