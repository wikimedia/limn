var fs, path, expand, mkdirpAsync, mkdirpSync, mkdirp, __slice = [].slice;
fs = require('fs');
path = require('path');
expand = exports.expand = function(){
  var parts, p, home;
  parts = __slice.call(arguments);
  p = path.normalize(path.join.apply(path, parts));
  if (p.indexOf('~') === 0) {
    home = process.env.HOME || process.env.HOMEPATH;
    p = path.join(home, p.slice(1));
  }
  return path.resolve(p);
};
mkdirpAsync = exports.mkdirpAsync = (function(){
  function mkdirpAsync(p, mode, cb){
    var _ref;
    mode == null && (mode = 493);
    if (typeof mode === 'function') {
      _ref = [mode, 493], cb = _ref[0], mode = _ref[1];
    }
    cb || (cb = function(){});
    p = expand(p);
    return path.exists(p, function(exists){
      var ps, _p;
      if (exists) {
        return cb(null);
      }
      ps = p.split('/');
      _p = ps.slice(0, -1).join('/');
      return mkdirpAsync(_p, mode, function(err){
        if ((err != null ? err.code : void 8) === 'EEXIST') {
          return cb(null);
        }
        if (err) {
          return cb(err);
        }
        return fs.mkdir(_p, function(err){
          if ((err != null ? err.code : void 8) === 'EEXIST') {
            return cb(null);
          }
          if (err) {
            return cb(err);
          }
        });
      });
    });
  }
  return mkdirpAsync;
}());
mkdirp = exports.mkdirp = mkdirpSync = exports.mkdirpSync = function(p, mode){
  var made_any, part, _p, _i, _ref, _len;
  mode == null && (mode = 493);
  made_any = false;
  _p = '';
  for (_i = 0, _len = (_ref = expand(p).slice(1).split('/')).length; _i < _len; ++_i) {
    part = _ref[_i];
    _p += '/' + part;
    if (path.existsSync(_p)) {
      continue;
    }
    made_any = true;
    fs.mkdirSync(_p, mode);
  }
  return made_any;
};