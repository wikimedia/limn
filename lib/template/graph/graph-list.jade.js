var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<section');
buf.push(attrs({ 'id':('graph-list') }));
buf.push('>\n  <div');
buf.push(attrs({ "class": ('page-header') }));
buf.push('>\n    <h1>Saved Graphs\n    </h1>\n  </div>\n  <ul>');
// iterate collection.models
(function(){
  if ('number' == typeof collection.models.length) {
    for (var $index = 0, $$l = collection.models.length; $index < $$l; $index++) {
      var graph = collection.models[$index];

buf.push('\n    <li><a');
buf.push(attrs({ 'href':("" + (graph.toLink()) + "") }));
buf.push('>' + escape((interp = graph.get('name') || graph.get('id') || graph.toLink()) == null ? '' : interp) + '</a>\n    </li>');
    }
  } else {
    for (var $index in collection.models) {
      var graph = collection.models[$index];

buf.push('\n    <li><a');
buf.push(attrs({ 'href':("" + (graph.toLink()) + "") }));
buf.push('>' + escape((interp = graph.get('name') || graph.get('id') || graph.toLink()) == null ? '' : interp) + '</a>\n    </li>');
   }
  }
}).call(this);

buf.push('\n  </ul>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}