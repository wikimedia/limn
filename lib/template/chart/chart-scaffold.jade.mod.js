require.define('/node_modules/kraken/template/chart/chart-scaffold.jade.js.js', function(require, module, exports, __dirname, __filename, undefined){

var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<form');
buf.push(attrs({ "class": ('chart-options') + ' ' + ('scaffold') + ' ' + ('form-inline') }));
buf.push('>\n  <div');
buf.push(attrs({ "class": ('chart-options-controls') + ' ' + ('control-group') }));
buf.push('><a');
buf.push(attrs({ 'href':("#"), "class": ('collapse-all-options-button') + ' ' + ('btn') }));
buf.push('>Collapse All</a><a');
buf.push(attrs({ 'href':("#"), "class": ('expand-all-options-button') + ' ' + ('btn') }));
buf.push('>Expand All</a>\n    <div');
buf.push(attrs({ 'data-toggle':("buttons-radio"), "class": ('std-adv-filter-buttons') + ' ' + ('btn-group') + ' ' + ('pull-right') }));
buf.push('><a');
buf.push(attrs({ 'href':("#"), 'data-filter':(".tag_standard"), "class": ('standard-filter-button') + ' ' + ('options-filter-button') + ' ' + ('btn') + ' ' + ('active') }));
buf.push('>Standard</a><a');
buf.push(attrs({ 'href':("#"), 'data-filter':(""), "class": ('advanced-filter-button') + ' ' + ('options-filter-button') + ' ' + ('btn') }));
buf.push('>Advanced</a>\n    </div>\n  </div>\n  <div');
buf.push(attrs({ 'data-subview':("ChartOptionView"), "class": ('fields') + ' ' + ('isotope') }));
buf.push('>\n  </div>\n</form>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}

});
