/**
 * @fileOverview Filesystem utilities.
 */
var fs, path, exists, Seq, glob, yaml, readFilesAsync, readJSONFilesAsync, logErrorsAnd, files, u, paths, _, __slice = [].slice;
fs = require('fs');
path = require('path');
exists = fs.existsSync || path.existsSync;
_ = require('underscore');
Seq = require('seq');
glob = require('glob');
yaml = require('js-yaml');
/**
 * Asynchronously reads the text for each filepath produced by the
 * globs supplied, returning a map from filepath to contents.
 * 
 * @param {String|Array<String>} patterns List of file-paths and/or glob-patterns to read.
 * @param {Object} [opts={}] Options:
 * @param {Boolean} [opts.verbose=false] Be chatty about errors.
 * @param {Function} cb Callback taking `(error, data)` where `data` is a map
 *  from filepath to contents. As always, `error` will be null on success.
 * @returns {Seq} The Seq object representing the async operation chain. (You
 *  can usually ignore this.)
 */
readFilesAsync = exports.readFilesAsync = function(patterns, opts, cb){
  var files, data, _ref;
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }
  if (typeof opts === 'function') {
    _ref = [opts, {}], cb = _ref[0], opts = _ref[1];
  }
  opts = (__import({
    verbose: false
  }, opts || {}));
  files = [];
  data = {};
  return Seq(patterns).parMap(function(pat){
    return glob(pat, {
      nocase: true,
      nosort: true
    }, this);
  }).flatten().parMap(function(f){
    files.push(f);
    return fs.readFile(f, 'utf8', this);
  }).parEach(function(text, i){
    var f;
    f = files[i];
    data[f] = text;
    return this.ok();
  }).seq(function(){
    return cb(null, data);
  })['catch'](function(err){
    console.error(err.file, err);
    return cb(err);
  });
};
/**
 * Asynchronously reads text and parses JSON for each filepath produced by the
 * globs supplied, returning a map from filepath to contents.
 * 
 * @param {String|Array<String>} patterns List of filepaths and/or glob-patterns to read.
 * @param {Object} [opts={}] Options:
 * @param {Boolean} [opts.verbose=false] Be chatty about errors.
 * @param {Boolean} [opts.yaml=false] Also search for and include YAML files.
 * @param {Boolean} [opts.appendExt=true] Treat the patterns as directories, and append
 *  the appropriate file extension glob-patterns.
 * @param {Function} cb Callback taking `(error, data)` where `data` is a map
 *  from filepath to contents. As always, `error` will be null on success.
 * @returns {Seq} The Seq object representing the async operation chain. (You
 *  can usually ignore this.)
 */
readJSONFilesAsync = exports.readJSONFilesAsync = function(patterns, opts, cb){
  var data, ext, _ref;
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }
  if (typeof opts === 'function') {
    _ref = [opts, {}], cb = _ref[0], opts = _ref[1];
  }
  opts = (__import({
    yaml: false,
    appendExt: true,
    verbose: false
  }, opts || {}));
  data = {};
  if (opts.appendExt) {
    ext = opts.yaml ? '@(yaml|json)' : 'json';
    patterns = patterns.map(function(it){
      return path.join(it, "*." + ext);
    });
  }
  return Seq().seq(readFilesAsync, patterns, {
    verbose: opts.verbose
  }, Seq).seq(function(data){
    return this.ok(_.map(data, function(text, f){
      return [f, text];
    }));
  }).flatten(false).parMap(function(_arg){
    var f, text, parser;
    f = _arg[0], text = _arg[1];
    parser = /\.yaml$/i.test(f)
      ? yaml.load
      : JSON.parse;
    try {
      data[f] = parser(text);
      return this.ok();
    } catch (err) {
      err.file = f;
      console.error(f, err);
      return cb(err);
    }
  }).seq(function(){
    return cb(null, data);
  })['catch'](function(err){
    console.error(err.file, err);
    return cb(err);
  });
};
logErrorsAnd = exports.logErrorsAnd = function(cb){
  return function(err){
    var args;
    args = __slice.call(arguments, 1);
    global.args = arguments;
    if (err) {
      return console.error(err);
    } else {
      if (cb) {
        return cb.apply(null, args);
      }
    }
  };
};
if (require.main === module) {
  files = exports;
  u = require('../util/underscore');
  paths = ['package.*', 'deploy.sh'];
  files.readFilesAsync(paths, function(err, data){
    if (err) {
      return console.error(err);
    } else {
      return console.log('\n\n', global.data = u.map(data, function(txt, f){
        return f + ": " + txt.length;
      }));
    }
  });
}
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}