/**
 * @fileOverview Filesystem utilities.
 */
var fs, path, Seq, glob, readFilesAsync, readJSONFilesAsync, logErrorsAnd, files, u, paths, _, __slice = [].slice;
fs = require('fs');
path = require('path');
_ = require('underscore');
Seq = require('seq');
glob = require('glob');
/**
 * Asynchronously reads the text for each filepath produced by the
 * globs supplied, returning a map from filepath to contents.
 * 
 * @param {String|Array<String>} patterns List of file-paths and/or glob-patterns to read.
 * @param {Function} cb Callback taking `(error, data)` where `data` is a map
 *  from filepath to contents. As always, `error` will be null on success.
 * @returns {Seq} The Seq object representing the async operation chain. (You
 *  can usually ignore this.)
 */
readFilesAsync = exports.readFilesAsync = function(patterns, cb){
  var files, data;
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }
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
 * @param {Function} cb Callback taking `(error, data)` where `data` is a map
 *  from filepath to contents. As always, `error` will be null on success.
 * @returns {Seq} The Seq object representing the async operation chain. (You
 *  can usually ignore this.)
 */
readJSONFilesAsync = exports.readJSONFilesAsync = function(patterns, cb){
  var data;
  data = {};
  return Seq().seq(function(){
    return readFilesAsync(patterns, this);
  }).seq(function(data){
    return this.ok(_.map(data, function(text, f){
      return [f, text];
    }));
  }).flatten(false).parMap(function(_arg){
    var f, text;
    f = _arg[0], text = _arg[1];
    try {
      data[f] = JSON.parse(text);
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
  u = require('kraken/util/underscore');
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