var DASH_PATTERN, STRIP_PAT, strip, FALSEY, parseBool, op, __slice = [].slice;
DASH_PATTERN = /-/g;
STRIP_PAT = /(^\s*|\s*$)/g;
strip = function(s){
  if (s) {
    return s.replace(STRIP_PAT, '');
  } else {
    return s;
  }
};
FALSEY = /^\s*(?:no|off|false)\s*$/i;
parseBool = function(s){
  var i;
  i = parseInt(s || 0);
  return !!(isNaN(i) ? !FALSEY.test(s) : i);
};
module.exports = op = {
  I: function(x){
    return x;
  },
  K: function(k){
    return function(){
      return k;
    };
  },
  nop: function(){},
  kThis: function(){
    return this;
  },
  kObject: function(){
    return {};
  },
  kArray: function(){
    return [];
  },
  val: function(def, o){
    return o != null ? o : def;
  },
  ok: function(o){
    return o != null;
  },
  notOk: function(o){
    return o == null;
  },
  first: function(a){
    return a;
  },
  second: function(_, a){
    return a;
  },
  nth: function(n){
    switch (n) {
    case 0:
      return op.first;
    case 1:
      return op.second;
    default:
      return function(){
        return arguments[n];
      };
    }
  },
  flip: function(fn){
    return function(a, b){
      arguments[0] = b;
      arguments[1] = a;
      return fn.apply(this, arguments);
    };
  },
  aritize: function(fn, cxt, n){
    var _ref;
    if (arguments.length < 3) {
      _ref = [cxt, null], n = _ref[0], cxt = _ref[1];
    }
    return function(){
      return fn.apply(cxt != null ? cxt : this, [].slice.call(arguments, 0, n));
    };
  },
  it: function(fn, cxt){
    return function(it){
      return fn.call(cxt != null ? cxt : this, it);
    };
  },
  khas: function(k, o){
    return k in o;
  },
  kget: function(k, o){
    return o[k];
  },
  defkget: function(def, k, o){
    if (k in o) {
      return o[k];
    } else {
      return def;
    }
  },
  thisget: function(k){
    return this[k];
  },
  vkset: function(o, v, k){
    if (o && k != null) {
      o[k] = v;
    }
    return o;
  },
  has: function(o, k){
    return k in o;
  },
  get: function(o, k){
    return o[k];
  },
  getdef: function(o, k, def){
    if (k in o) {
      return o[k];
    } else {
      return def;
    }
  },
  kvset: function(o, k, v){
    if (o && k != null) {
      o[k] = v;
    }
    return o;
  },
  thiskvset: function(k, v){
    if (k != null) {
      this[k] = v;
    }
    return this;
  },
  prop: function(k){
    return function(o){
      return o[k];
    };
  },
  method: function(name){
    var args;
    args = __slice.call(arguments, 1);
    return function(obj){
      var _args;
      _args = __slice.call(arguments, 1);
      if (obj != null && obj[name]) {
        return obj[name].apply(obj, args.concat(_args));
      }
    };
  },
  isK: function(k){
    return function(v){
      return v === k;
    };
  },
  parseBool: parseBool,
  toBool: parseBool,
  toInt: function(v){
    return parseInt(v);
  },
  toFloat: function(v){
    return parseFloat(v);
  },
  toStr: function(v){
    return String(v);
  },
  toRegExp: function(v){
    return new RegExp(v);
  },
  toObject: function(v){
    if (typeof v === 'string' && strip(v)) {
      return JSON.parse(v);
    } else {
      return v;
    }
  },
  toDate: function(v){
    if (v == null || v instanceof Date) {
      return v;
    }
    if (typeof v === 'number') {
      return new Date(v);
    }
    return new Date(String(v).replace(DASH_PATTERN, '/'));
  },
  cmp: function(x, y){
    if (x < y) {
      return -1;
    } else {
      return x > y ? 1 : 0;
    }
  },
  eq: function(x, y){
    return x == y;
  },
  ne: function(x, y){
    return x != y;
  },
  gt: function(x, y){
    return x > y;
  },
  ge: function(x, y){
    return x >= y;
  },
  lt: function(x, y){
    return x < y;
  },
  le: function(x, y){
    return x <= y;
  },
  add: function(x, y){
    return x + y;
  },
  sub: function(x, y){
    return x - y;
  },
  mul: function(x, y){
    return x * y;
  },
  div: function(x, y){
    return x / y;
  },
  flrdiv: function(x, y){
    return Math.floor(x / y);
  },
  mod: function(x, y){
    return x % y;
  },
  neg: function(x){
    return -x;
  },
  log2: function(n){
    return Math.log(n / Math.LN2);
  },
  is: function(x, y){
    return x === y;
  },
  isnt: function(x, y){
    return x !== y;
  },
  and: function(x, y){
    return x && y;
  },
  or: function(x, y){
    return x || y;
  },
  not: function(x){
    return !x;
  },
  bitnot: function(x){
    return ~x;
  },
  bitand: function(x, y){
    return x & y;
  },
  bitor: function(x, y){
    return x | y;
  },
  bitxor: function(x, y){
    return x ^ y;
  },
  lshift: function(x, y){
    return x << y;
  },
  rshift: function(x, y){
    return x >> y;
  },
  bin: function(n){
    var s;
    do {
      s = (n % 2 ? '1' : '0') + (s || '');
      n >>= 1;
    } while (n);
    return s;
  },
  binlen: function(n){
    return bin(Math.abs(n)).length;
  },
  mask: function(n){
    return (1 << n) - 1;
  },
  chr: function(it){
    return String.fromCharCode(it);
  },
  ord: function(it){
    return String(it).charCodeAt(0);
  },
  encode: function(it){
    return it && $("<div>" + it + "</div>").html().replace(/"/g, '&quot;');
  },
  decode: function(it){
    return it && $("<div>" + it + "</div>").text();
  },
  strip: strip
};