require.define('/node_modules/limn/template/dashboard/dashboard.js', function(require, module, exports, __dirname, __filename, undefined){

var template = function (locals, attrs, escape, rethrow) {
var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;
var buf = [];
with (locals || {}) {
var interp;
buf.push('\n<section');
buf.push(attrs({ 'id':('dashboard'), "class": ('centered') }));
buf.push('>\n  <div');
buf.push(attrs({ "class": ('page-header') }));
buf.push('>\n    <h1>Wikimedia Report Card <small>April 2012</small>\n    </h1>\n  </div>\n  <div');
buf.push(attrs({ "class": ('row') }));
buf.push('>\n    <div');
buf.push(attrs({ "class": ('graphs') + ' ' + ('tabbable') }));
buf.push('>\n      <nav>\n        <ul');
buf.push(attrs({ "class": ('nav') + ' ' + ('subnav') + ' ' + ('nav-pills') }));
buf.push('>\n          <li>\n            <h3>Graphs\n            </h3>\n          </li>\n        </ul>\n      </nav>\n      <div');
buf.push(attrs({ 'data-subview':("DashboardTabView"), "class": ('tab-content') }));
buf.push('>\n      </div>\n    </div>\n  </div>\n</section>');
}
return buf.join("");
};
if (typeof module != 'undefined') {
    module.exports = exports = template;
}

});
