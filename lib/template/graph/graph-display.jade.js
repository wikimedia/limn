var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
 window.Markdown || (window.Markdown = new (require('showdown').Showdown).converter());
 (jade.filters || (jade.filters = {})).markdown = function (s, name){ return s && Markdown.makeHtml(s.replace(/\n/g, '\n\n')); };
 var graph_id = view.id
buf.push('\n<section');
buf.push(attrs({ 'id':(graph_id), "class": ('graph-display') + ' ' + ('graph') }));
buf.push('>\n  <div');
buf.push(attrs({ "class": ('graph-name-row') + ' ' + ('row-fluid') }));
buf.push('>\n    <div');
buf.push(attrs({ "class": ('callout') }));
buf.push('>\n      <div');
buf.push(attrs({ 'data-bind':('callout.latest'), "class": ('latest-metric') }));
buf.push('>' + escape((interp = callout.latest) == null ? '' : interp) + '\n      </div>\n      <div');
buf.push(attrs({ "class": ('metric-change') + ' ' + ('year-over-year') }));
buf.push('><span');
buf.push(attrs({ 'data-bind':('callout.year.dates'), "class": ('dates') }));
buf.push('>' + escape((interp = callout.year.dates) == null ? '' : interp) + '</span><span');
buf.push(attrs({ 'data-bind':('callout.year.value'), "class": ('value') }));
buf.push('>' + escape((interp = callout.year.value) == null ? '' : interp) + '</span>\n      </div>\n      <div');
buf.push(attrs({ "class": ('metric-change') + ' ' + ('month-over-month') }));
buf.push('><span');
buf.push(attrs({ 'data-bind':('callout.month.dates'), "class": ('dates') }));
buf.push('>' + escape((interp = callout.month.dates) == null ? '' : interp) + '</span><span');
buf.push(attrs({ 'data-bind':('callout.month.value'), "class": ('value') }));
buf.push('>' + escape((interp = callout.month.value) == null ? '' : interp) + '</span>\n      </div>\n    </div>\n    <h2><a');
buf.push(attrs({ 'href':("" + (model.toLink()) + ""), 'data-bind':('name'), 'name':("" + (graph_id) + ""), "class": ('graph-name') }));
buf.push('>' + escape((interp = name) == null ? '' : interp) + '</a>\n    </h2>\n  </div>\n  <div');
buf.push(attrs({ "class": ('graph-viewport-row') + ' ' + ('row-fluid') }));
buf.push('>\n    <div');
buf.push(attrs({ "class": ('inner') }));
buf.push('>\n      <div');
buf.push(attrs({ "class": ('viewport') }));
buf.push('>\n      </div>\n      <div');
buf.push(attrs({ "class": ('graph-legend') }));
buf.push('>\n      </div>\n    </div>\n  </div>\n  <div');
buf.push(attrs({ "class": ('graph-details-row') + ' ' + ('row') }));
buf.push('>\n    <div');
buf.push(attrs({ 'data-bind':('desc'), "class": ('span7') + ' ' + ('offset3') + ' ' + ('ug') + ' ' + ('graph-desc') }));
buf.push('>');
var __val__ = jade.filters.markdown(desc)
buf.push(null == __val__ ? "" : __val__);
buf.push('\n    </div>\n  </div>\n  <div');
buf.push(attrs({ "class": ('graph-links-row') + ' ' + ('row') }));
buf.push('>\n    <div');
buf.push(attrs({ "class": ('span6') + ' ' + ('offset3') + ' ' + ('ug') + ' ' + ('graph-permalink') }));
buf.push('>\n      <input');
buf.push(attrs({ 'value':("" + (model.toPermalink()) + ""), 'readonly':("readonly"), "class": ('span6') }));
buf.push('/>\n    </div>');
if ( IS_DEV)
{
buf.push('<a');
buf.push(attrs({ 'href':("#"), "class": ('span1') + ' ' + ('export-button') + ' ' + ('btn') }));
buf.push('><i');
buf.push(attrs({ "class": ('icon-file') }));
buf.push('></i> Export\n</a>');
}
buf.push('\n  </div>\n  <div');
buf.push(attrs({ "class": ('graph-notes-row') + ' ' + ('row') }));
buf.push('>\n    <div');
buf.push(attrs({ 'data-bind':('notes'), "class": ('span7') + ' ' + ('offset3') + ' ' + ('ug') + ' ' + ('graph-notes') }));
buf.push('>');
var __val__ = jade.filters.markdown(notes)
buf.push(null == __val__ ? "" : __val__);
buf.push('\n    </div>\n  </div>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}