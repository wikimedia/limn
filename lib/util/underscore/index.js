var exports, _;
_ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.mixin(require('kraken/util/underscore/function'));
_.mixin(require('kraken/util/underscore/array'));
_.mixin(require('kraken/util/underscore/object'));
_.mixin(require('kraken/util/underscore/class'));
_.mixin(require('kraken/util/underscore/kv'));
_.mixin(require('kraken/util/underscore/string'));
_.dump = function(o, label, expanded){
  var k, v;
  label == null && (label = 'dump');
  expanded == null && (expanded = true);
  if (!_.isArray(o) && _.isObject(o)) {
    if (expanded) {
      console.group(label);
    } else {
      console.groupCollapsed(label);
    }
    for (k in o) {
      v = o[k];
      console.log(k + ":", v);
    }
    console.groupEnd();
  } else {
    console.log(label, o);
  }
  return o;
};
module.exports = exports = _;