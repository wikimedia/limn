var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<section');
buf.push(attrs({ "class": ('metric-edit-ui') }));
buf.push('>\n  <div');
buf.push(attrs({ "class": ('inner') }));
buf.push('>\n    <form');
buf.push(attrs({ "class": ('metric-edit-form') + ' ' + ('form-horizontal') }));
buf.push('>\n      <div');
buf.push(attrs({ "class": ('metric-header') + ' ' + ('control-group') }));
buf.push('>\n        <div');
buf.push(attrs({ 'data-color':("" + (color) + ""), 'data-color-format':("hex"), "class": ('color-swatch') + ' ' + ('input-append') + ' ' + ('color') }));
buf.push('>\n          <input');
buf.push(attrs({ 'type':('hidden'), 'id':("" + (graph_id) + "_metric_color"), 'name':("color"), 'value':(color), "class": ('metric-color') }));
buf.push('/><span');
buf.push(attrs({ "class": ('add-on') }));
buf.push('><i');
buf.push(attrs({ 'style':("background-color: " + (color) + ";"), 'title':("" + (color) + "") }));
buf.push('></i></span>\n        </div>\n        <input');
buf.push(attrs({ 'type':('text'), 'id':("" + (graph_id) + "_metric_label"), 'name':('label'), 'placeholder':('' + (placeholder_label) + ''), 'value':(label), "class": ('metric-label') }));
buf.push('/>\n      </div>\n      <div');
buf.push(attrs({ 'data-subview':("DataSourceUIView"), "class": ('metric-datasource') + ' ' + ('control-group') }));
buf.push('>\n      </div>\n      <div');
buf.push(attrs({ "class": ('metric-actions') + ' ' + ('control-group') }));
buf.push('><a');
buf.push(attrs({ 'href':("#"), "class": ('delete-button') + ' ' + ('btn') + ' ' + ('btn-danger') }));
buf.push('><i');
buf.push(attrs({ "class": ('icon-remove') + ' ' + ('icon-white') }));
buf.push('></i> Delete\n</a>\n      </div>\n      <div');
buf.push(attrs({ "class": ('metric-options') + ' ' + ('row-fluid') }));
buf.push('>\n      </div>\n    </form>\n  </div>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}