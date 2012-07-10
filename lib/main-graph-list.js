var op, BaseView, BaseModel, BaseList, Graph, GraphList, GraphListView, main, graph_list_url, _ref, _;
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
_ref = require('kraken/base'), BaseView = _ref.BaseView, BaseModel = _ref.BaseModel, BaseList = _ref.BaseList;
_ref = require('kraken/graph'), Graph = _ref.Graph, GraphList = _ref.GraphList, GraphListView = _ref.GraphListView;
main = function(graph_list_data){
  var graphs, view;
  graphs = new GraphList(graph_list_data);
  view = new GraphListView({
    'collection': graphs
  });
  return $('#content .inner').append(view.el);
};
graph_list_url = '/graphs.json';
jQuery.ajax({
  url: graph_list_url,
  dataType: 'json',
  success: function(res){
    return jQuery(main.bind(this, res));
  },
  error: function(err){
    return console.error(err);
  }
});