require.define('/node_modules/limn/dashboard/dashboard-view.js', function(require, module, exports, __dirname, __filename, undefined){

var Seq, op, BaseModel, BaseView, Graph, GraphList, GraphDisplayView, Dashboard, DashboardView, DashboardTabView, _ref, _;
Seq = require('seq');
_ref = require('../util'), _ = _ref._, op = _ref.op;
_ref = require('../base'), BaseModel = _ref.BaseModel, BaseView = _ref.BaseView;
_ref = require('../graph'), Graph = _ref.Graph, GraphList = _ref.GraphList, GraphDisplayView = _ref.GraphDisplayView;
Dashboard = require('./dashboard-model').Dashboard;
/**
 * @class
 */
DashboardView = exports.DashboardView = BaseView.extend({
  __bind__: ['addTab'],
  tagName: 'section',
  className: 'dashboard',
  template: require('../template/dashboard/dashboard'),
  events: {
    'click .graphs.tabbable .nav a': 'onTabClick',
    'shown .graphs.tabbable .nav a': 'render'
  },
  graphs: null,
  ready: false,
  constructor: (function(){
    function DashboardView(options){
      options == null && (options = {});
      this.graphs = new GraphList;
      return BaseView.apply(this, arguments);
    }
    return DashboardView;
  }()),
  initialize: function(){
    this.model || (this.model = new Dashboard);
    DashboardView.__super__.initialize.apply(this, arguments);
    return this.model.once('ready', this.load, this).load();
  },
  load: function(){
    var _this = this;
    console.log(this + ".load! Model ready!", this.model);
    return Seq(this.model.get('tabs')).seqEach_(this.addTab).seq(function(){
      console.log(_this + ".load! Done adding tabs!");
      return _this.triggerReady();
    });
  },
  addTab: function(nextTab, tab){
    var tabModel, tabView, tabId, graphs, _this = this;
    tabModel = new BaseModel(tab);
    tabView = this.addSubview(new DashboardTabView({
      model: tabModel
    }));
    tabId = tabView.getTabId();
    this.$("nav > ul.nav").append("<li class='" + tabId + "-button'><a href='#" + tabId + "' data-toggle='tab'>" + tab.name + "</a></li>");
    graphs = _(tab.graph_ids).map(function(graph_id){
      return _this.model.graphs.get(graph_id);
    });
    Seq(graphs).parMap_(function(next, graph){
      _this.graphs.add(graph);
      return next(null, new GraphDisplayView({
        model: graph
      }));
    }).parMap_(function(next, graphView){
      if (graphView.isAttached) {
        return next.ok();
      }
      tabView.addSubview(graphView);
      return next.ok();
    }).seq(function(){
      console.log(_this + ".addTab: All graphs added!");
      return nextTab.ok();
    });
    return this;
  },
  onTabShown: function(e){
    return this.render();
  },
  onTabClick: function(evt){
    return evt.preventDefault();
  }
  /**
   * Scroll to the specified graph.
   * 
   * @param {String|Number|Graph} graph The Graph to scroll to; can be specified as a
   *  Graph id, an index into the Graphs list, or a Graph object.
   * @returns {this} 
   */,
  scrollToGraph: function(graph){
    var view;
    if (typeof graph === 'string') {
      graph = this.graphs.get(graph);
    } else if (typeof graph === 'number') {
      graph = this.graphs.at(graph);
    }
    if (!(graph instanceof Graph)) {
      console.error(this + ".scrollToGraph() Unknown graph " + graph + "!");
      return this;
    }
    if (!(view = _.find(this.subviews, function(it){
      return it.model === graph;
    }))) {
      return this;
    }
    if (view.$el.is(':visible')) {
      $('body').scrollTop(view.$el.offset().top);
    }
    return this;
  },
  findClosestGraph: function(scroll){
    var views;
    scroll || (scroll = $('body').scrollTop());
    views = this.subviews.filter(function(it){
      return it.$el.is(':visible');
    }).map(function(it){
      return [it.$el.offset().top, it];
    }).filter(function(it){
      return it[0] >= scroll;
    }).sort(function(a, b){
      return op.cmp(a[0], b[0]);
    });
    if (views.length) {
      return views[0][1];
    }
  }
});
/**
 * @class
 * @extends BaseView
 */
DashboardTabView = exports.DashboardTabView = BaseView.extend({
  __bind__: [],
  className: 'tab-pane',
  tag: 'div',
  template: require('../template/dashboard/dashboard-tab'),
  constructor: (function(){
    function DashboardTabView(){
      return BaseView.apply(this, arguments);
    }
    return DashboardTabView;
  }()),
  initialize: function(){
    return BaseView.prototype.initialize.apply(this, arguments);
  },
  getTabId: function(){
    return _.underscored(this.model.get('name')).toLowerCase() + '-graphs-tab';
  },
  toTemplateLocals: function(){
    var json, tab_name;
    json = DashboardTabView.__super__.toTemplateLocals.apply(this, arguments);
    tab_name = _.underscored(this.model.get('name')).toLowerCase();
    return json.tab_cls = tab_name + "-graphs-pane", json.tab_id = tab_name + "-graphs-tab", json;
  }
});

});
