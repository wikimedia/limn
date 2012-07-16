require.define('/node_modules/limn/template/chart/chart-option.js', function(require, module, exports, __dirname, __filename, undefined){

var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
 window.Markdown || (window.Markdown = new (require('showdown').Showdown).converter());
 (jade.filters || (jade.filters = {})).markdown = function (s, name){ return s && Markdown.makeHtml(s.replace(/\n/g, '\n\n')); };
 var option_id    = _.domize('option', id)
 var value_id     = _.domize('value', id)
 var type_cls     = _.domize('type', type)
 var category_cls = _.domize('category', model.getCategoryIndex()) + ' ' + _.domize('category', model.getCategory())
 var tags_cls     = tags.map(_.domize('tag')).join(' ')
buf.push('\n<section');
buf.push(attrs({ 'id':(option_id), "class": ('chart-option') + ' ' + ('field') + ' ' + ('isotope-item') + ' ' + ("" + (category_cls) + " " + (tags_cls) + "") }));
buf.push('><a');
buf.push(attrs({ 'title':("Click to collapse"), "class": ('close') }));
buf.push('>&times;</a>\n  <h3');
buf.push(attrs({ 'title':("Click to collapse"), "class": ('shortname') }));
buf.push('>' + escape((interp = name) == null ? '' : interp) + '\n  </h3>\n  <label');
buf.push(attrs({ 'for':(value_id), "class": ('name') }));
buf.push('>' + escape((interp = name) == null ? '' : interp) + '\n  </label>');
if ( ( /object|array|function/i.test(type) ))
{
buf.push('\n  <textarea');
buf.push(attrs({ 'id':(value_id), 'name':(name), 'data-bind':("value"), "class": ('value') + ' ' + (type_cls) }));
buf.push('>' + escape((interp = value) == null ? '' : interp) + '\n  </textarea>');
}
else
{
 var input_type = (/boolean/i.test(type) ? 'checkbox' : 'text');
 var checked = ((/boolean/i.test(type) && value) ? 'checked' : null);
buf.push('\n  <input');
buf.push(attrs({ 'type':(input_type), 'id':(value_id), 'name':(name), 'value':(value), 'checked':(checked), 'data-bind':("value"), "class": ('value') + ' ' + (type_cls) }));
buf.push('/>');
}
buf.push('\n  <div');
buf.push(attrs({ "class": ('type') + ' ' + (type_cls) }));
buf.push('>' + escape((interp = type) == null ? '' : interp) + '\n  </div>\n  <div');
buf.push(attrs({ 'title':("Default: " + (def) + " (" + (type) + ")"), "class": ('default') + ' ' + (type_cls) }));
buf.push('>' + escape((interp = def) == null ? '' : interp) + '\n  </div>\n  <div');
buf.push(attrs({ "class": ('desc') }));
buf.push('>');
var __val__ = jade.filters.markdown(desc)
buf.push(null == __val__ ? "" : __val__);
buf.push('\n  </div>\n  <div');
buf.push(attrs({ "class": ('tags') }));
buf.push('>');
// iterate tags
(function(){
  if ('number' == typeof tags.length) {
    for (var $index = 0, $$l = tags.length; $index < $$l; $index++) {
      var tag = tags[$index];

 var tag_cls = _.domize('tag',tag) + ' ' + _.domize('category',model.getTagIndex(tag))
buf.push('<span');
buf.push(attrs({ "class": ('tag') + ' ' + (tag_cls) }));
buf.push('>' + escape((interp = tag) == null ? '' : interp) + '</span> \n');
    }
  } else {
    for (var $index in tags) {
      var tag = tags[$index];

 var tag_cls = _.domize('tag',tag) + ' ' + _.domize('category',model.getTagIndex(tag))
buf.push('<span');
buf.push(attrs({ "class": ('tag') + ' ' + (tag_cls) }));
buf.push('>' + escape((interp = tag) == null ? '' : interp) + '</span> \n');
   }
  }
}).call(this);

buf.push('\n  </div>\n  <div');
buf.push(attrs({ 'data-toggle':("collapse"), 'data-target':("#" + (option_id) + " .examples ul"), "class": ('examples') }));
buf.push('>\n    <ul');
buf.push(attrs({ "class": ('collapse') }));
buf.push('>');
// iterate examples
(function(){
  if ('number' == typeof examples.length) {
    for (var $index = 0, $$l = examples.length; $index < $$l; $index++) {
      var example = examples[$index];

buf.push('\n      <li');
buf.push(attrs({ "class": ('example') }));
buf.push('><a');
buf.push(attrs({ 'href':("http://dygraphs.com/tests/" + (example) + ".html"), 'target':("_blank") }));
buf.push('>' + escape((interp = example) == null ? '' : interp) + '</a>\n      </li>');
    }
  } else {
    for (var $index in examples) {
      var example = examples[$index];

buf.push('\n      <li');
buf.push(attrs({ "class": ('example') }));
buf.push('><a');
buf.push(attrs({ 'href':("http://dygraphs.com/tests/" + (example) + ".html"), 'target':("_blank") }));
buf.push('>' + escape((interp = example) == null ? '' : interp) + '</a>\n      </li>');
   }
  }
}).call(this);

buf.push('\n    </ul>\n  </div>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}

});
