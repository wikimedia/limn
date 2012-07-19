var _, _str, _string, __slice = [].slice;
_ = require('underscore');
_str = require('underscore.string');
_string = {
  /**
   * As _.str.chop but from the right.
   */
  rchop: function(s, step){
    var i, out;
    s = String(s);
    i = s.length;
    step = Number(step);
    out = [];
    if (step <= 0) {
      return [s];
    }
    while (i > 0) {
      out.unshift(s.slice(Math.max(0, i - step), i));
      i -= step;
    }
    return out;
  },
  drop: function(s){
    var parts, starting, part, _i, _len;
    parts = __slice.call(arguments, 1);
    do {
      starting = s;
      for (_i = 0, _len = parts.length; _i < _len; ++_i) {
        part = parts[_i];
        if (_str.startsWith(s, part)) {
          s = s.slice(part.length);
        }
        if (_str.endsWith(s, part)) {
          s = s.slice(0, s.length - part.length);
        }
      }
    } while (s && s !== starting);
    return s;
  },
  ldrop: function(s){
    var parts, starting, part, _i, _len;
    parts = __slice.call(arguments, 1);
    do {
      starting = s;
      for (_i = 0, _len = parts.length; _i < _len; ++_i) {
        part = parts[_i];
        if (_str.startsWith(s, part)) {
          s = s.slice(part.length);
        }
      }
    } while (s && s !== starting);
    return s;
  },
  rdrop: function(s){
    var parts, starting, part, _i, _len;
    parts = __slice.call(arguments, 1);
    do {
      starting = s;
      for (_i = 0, _len = parts.length; _i < _len; ++_i) {
        part = parts[_i];
        if (_str.endsWith(s, part)) {
          s = s.slice(0, s.length - part.length);
        }
      }
    } while (s && s !== starting);
    return s;
  },
  domize: function(key, value){
    key == null && (key = '');
    value == null && (value = '');
    key = _str.trim(_str.underscored(key), '_');
    if (arguments.length <= 1) {
      return arguments.callee.bind(this, key);
    } else {
      return key + "_" + _str.trim(_str.underscored(value), '_');
    }
  },
  shortname: function(s){
    var parts;
    if (s.length <= 6) {
      return s;
    }
    parts = _(s).chain().underscored().trim('_').value().replace(/_+/g, '_').split('_').map(function(it){
      return _.capitalize(it.slice(0, 2));
    });
    if (parts.length === 1) {
      return s;
    }
    return parts.shift().toLowerCase() + parts.join('');
  }
};
__import(_string, {
  dropLeft: _string.ldrop,
  dropRight: _string.rdrop
});
__import(exports, _string);
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}