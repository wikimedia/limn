require.define('/node_modules/limn/dashboard/dashboard-model.js', function(require, module, exports, __dirname, __filename, undefined){

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
      tabs: [{
        name: "Main",
        graph_ids: []
      }]
    };
  },
  load: function(){
    var _this = this;
    this.once('fetch-success', function(){
      return _this.getGraphs();
    }).loadModel();
    return this;
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
  },
  getGraphs: function(){
    var graph_ids, _this = this;
    console.log('[getGraphs]\tentering');
    graph_ids = _(this.tabs).chain().values().map(function(tab_obj){
      return tab_obj.graph_ids;
    }).flatten().value();
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
  }
});

});
