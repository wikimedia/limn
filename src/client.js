(function(){
  var EventEmitter, ref$, _, op, event, root, limn, emitter, i$, len$, k, Backbone, BaseView, BaseModel, BaseList, ChartType, DygraphsChartType, Graph, GraphList, GraphDisplayView, GraphEditView, GraphListView, DashboardView, Dashboard, LimnApp;
  EventEmitter = require('events').EventEmitter;
  ref$ = require('./util'), _ = ref$._, op = ref$.op, event = ref$.event, root = ref$.root;
  limn = exports;
  emitter = limn.__emitter__ = new event.ReadyEmitter();
  for (i$ = 0, len$ = (ref$ = ['on', 'addListener', 'off', 'removeListener', 'emit', 'trigger', 'once', 'removeAllListeners']).length; i$ < len$; ++i$) {
    k = ref$[i$];
    limn[k] = emitter[k].bind(emitter);
  }
  limn.mount = function(path){
    var ref$, mnt;
    mnt = ((ref$ = limn.config) != null ? ref$.mount : void 8) || '/';
    return (mnt !== '/' ? mnt : '') + path;
  };
  Backbone = require('backbone');
  ref$ = limn.base = require('./base'), BaseView = ref$.BaseView, BaseModel = ref$.BaseModel, BaseList = ref$.BaseList;
  ref$ = limn.chart = require('./chart'), ChartType = ref$.ChartType, DygraphsChartType = ref$.DygraphsChartType;
  ref$ = limn.graph = require('./graph'), Graph = ref$.Graph, GraphList = ref$.GraphList, GraphDisplayView = ref$.GraphDisplayView, GraphEditView = ref$.GraphEditView, GraphListView = ref$.GraphListView;
  ref$ = limn.dashboard = require('./dashboard'), DashboardView = ref$.DashboardView, Dashboard = ref$.Dashboard;
  limn.data = require('./data');
  limn.chart = require('./chart');
  limn.util = require('./util');
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
      'dashboards': 'listDashboards',
      'random': 'playRandom'
    },
    playRandom: function(){
      this.model = new BaseModel;
      return this.view = new BaseView({
        model: this.model
      }).attach(this.el);
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
      var this$ = this;
      jQuery(function(){
        return this$.setup();
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
      this.view = new DashboardView({
        model: this.model
      }).attach(this.el);
      return this.model.once('ready', this.updateDashboardTitle, this);
    },
    listDashboards: function(){
      return console.error('listDashboards!?');
    },
    updateDashboardTitle: function(){
      var dashName, ref$, sub, head;
      if (!(dashName = this.model.getName())) {
        return this;
      }
      if ((ref$ = root.document) != null) {
        ref$.title = dashName;
      }
      if (sub = this.model.get('subhead')) {
        head = this.model.get('headline');
        this.$('.page-header h1').html(head + " <small>" + sub + "</small>");
      }
      return this;
    },
    $: function(){
      return this.$el.find.apply(this.$el, arguments);
    },
    getClassName: function(){
      return (this.constructor.name || this.constructor.displayName) + "";
    },
    toString: function(){
      return this.getClassName() + "()";
    }
  });
  import$(LimnApp, {
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
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
