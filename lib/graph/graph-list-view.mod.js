require.define('/node_modules/kraken/graph/graph-list-view.js.js', function(require, module, exports, __dirname, __filename, undefined){

var op, BaseView, Graph, GraphList, root, DEBOUNCE_RENDER, GraphListView, _ref, _;
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
BaseView = require('kraken/base').BaseView;
_ref = require('kraken/graph/graph-model'), Graph = _ref.Graph, GraphList = _ref.GraphList;
root = function(){
  return this;
}();
DEBOUNCE_RENDER = 100;
/**
 * @class View for a showing a list of all saved graphs
 */
GraphListView = exports.GraphListView = BaseView.extend({
  __bind__: ['render'],
  __debounce__: ['render'],
  tagName: 'section',
  className: 'graph-list-view',
  template: require('kraken/template/graph/graph-list'),
  data: {},
  ready: false,
  initialize: function(){
    this.model = this.collection || (this.collection = new GraphList);
    return BaseView.prototype.initialize.apply(this, arguments);
  },
  toTemplateLocals: function(){
    var locals;
    locals = BaseView.prototype.toTemplateLocals.apply(this, arguments);
    locals.collection = this.collection;
    return locals;
  }
});

});
