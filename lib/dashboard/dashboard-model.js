var Seq, op, BaseModel, Graph, GraphList, Dashboard, _ref, _;
Seq = require('seq');
_ref = require('../util'), _ = _ref._, op = _ref.op;
BaseModel = require('../base').BaseModel;
_ref = require('../graph/graph-model'), Graph = _ref.Graph, GraphList = _ref.GraphList;
/**
 * @class
 */
Dashboard = exports.Dashboard = BaseModel.extend({
  urlRoot: '/dashboards',
  graphs: null,
  constructor: (function(){
    function Dashboard(){
      this.graphs = new GraphList;
      return BaseModel.apply(this, arguments);
    }
    return Dashboard;
  }()),
  initialize: function(){
    return BaseModel.prototype.initialize.apply(this, arguments);
  },
  defaults: function(){
    return {
      name: null,
      headline: '',
      subhead: '',
      tabs: [{
        name: "Main",
        graph_ids: []
      }]
    };
  },
  load: function(){
    var _this = this;
    this.once('fetch-success', function(){
      return _this.lookupGraphs();
    }).loadModel();
    return this;
  },
  getName: function(){
    return this.get('name') || _.compact([this.get('headline'), this.get('subhead')]).join(', ');
  }
  /**
   * Look up a tab.
   * 
   * @param {String|Number} tab Tab name or index.
   * @returns {Tab} Tab object.
   */,
  getTab: function(tab){
    var tabs;
    tabs = this.get('tabs');
    if (typeof tab === 'number') {
      return tabs[tab];
    }
    return _.find(tabs, function(it){
      return it.name === tab;
    });
  }
  /**
   * Get references to all the graphs from all the dashboards.
   * @returns {this}
   */,
  lookupGraphs: function(){
    var graph_ids, _this = this;
    graph_ids = _(this.get('tabs')).chain().values().pluck('graph_ids').flatten().value();
    Seq(graph_ids).parMap(function(id){
      return Graph.lookup(id, this);
    }).unflatten().seq_(function(next, graphs){
      _this.graphs.reset(graphs);
      return _this.triggerReady();
    });
    return this;
  },
  getGraphs: function(){
    var graph_ids, _this = this;
    console.log('[getGraphs]\tentering');
    graph_ids = _(this.get('tabs')).chain().values().pluck('graph_ids').flatten().value();
    Seq(graph_ids).parMap_(function(next, graph_id){
      return next(null, [graph_id]);
    }).parEach_(function(next, graph_id_arr){
      return Graph.lookup(graph_id_arr[0], _this.pushAsync(next, graph_id_arr));
    }).parMap_(function(next, tuple){
      var id, graph;
      id = tuple[0], graph = tuple[1];
      return graph.once('ready', function(){
        return next.ok(tuple);
      });
    }).unflatten().seq_(function(next, graph_tuples){
      _this.graphs.reset(_.pluck(graph_tuples, 1));
      console.log('[setter]\tcalling ready');
      return _this.triggerReady();
    });
    return this;
  },
  show: function(cb, obj){
    console.log('[show]');
    console.log(obj);
    return cb(null, obj);
  },
  pushAsync: function(cb, arr){
    return function(err, elem){
      arr.push(elem);
      return cb(null);
    };
  }
});