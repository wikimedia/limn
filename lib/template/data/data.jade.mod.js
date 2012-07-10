require.define('/node_modules/kraken/template/data/data.jade.js.js', function(require, module, exports, __dirname, __filename, undefined){

var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<section');
buf.push(attrs({ "class": ('data-ui') }));
buf.push('>\n  <form');
buf.push(attrs({ "class": ('data-ui-form') }));
buf.push('>\n    <div');
buf.push(attrs({ 'data-subview':("MetricEditView"), "class": ('metric_edit_view_pane') }));
buf.push('>\n    </div>\n    <div');
buf.push(attrs({ 'data-subview':("DataSetView"), "class": ('data_set_view_pane') }));
buf.push('>\n    </div>\n  </form>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}

});
