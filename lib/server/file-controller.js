var fs, path, exists, Seq, yaml, mkdirp, mkdirpAsync, readJSONFilesAsync, Controller, FileBackedController, exports, _, _ref;
fs = require('fs');
path = require('path');
exists = path.existsSync;
_ = require('underscore');
Seq = require('seq');
yaml = require('js-yaml');
_ref = require('./mkdirp'), mkdirp = _ref.mkdirp, mkdirpAsync = _ref.mkdirpAsync;
readJSONFilesAsync = require('./files').readJSONFilesAsync;
Controller = require('./controller');
/**
 * @class Resource controller backed by flat json or yaml files.
 */
FileBackedController = (function(superclass){
  FileBackedController.displayName = 'FileBackedController';
  var prototype = __extend(FileBackedController, superclass).prototype, constructor = FileBackedController;
  prototype.name = null;
  prototype.dataDir = null;
  function FileBackedController(){
    this.dataDir || (this.dataDir = "data/" + this.name);
    superclass.apply(this, arguments);
  }
  /**
   * Override to customize lookup of files by ID.
   * 
   * @param {String} id ID of this resource.
   * @returns {String} Path to file for this resource.
   */
  prototype.toFile = function(id){
    return this.dataDir + "/" + id + ".json";
  };
  /**
   * Auto-load :id for related requests.
   * 
   * @param {String} id ID of the resource.
   * @param {Function} cb Callback to invoke with the loaded object.
   */
  prototype.autoload = function(id, cb){
    var file, parser, yamlFile;
    file = this.toFile(id);
    parser = JSON.parse;
    yamlFile = file.replace(/\.json$/i, '.yaml');
    if (exists(yamlFile)) {
      file = yamlFile;
      parser = yaml.load;
    }
    return fs.readFile(file, 'utf8', function(err, data){
      if ('ENOENT' === (err != null ? err.code : void 8)) {
        return cb(null, {});
      }
      if (err) {
        console.error(this + ".autoload(" + id + ", " + typeof cb + ") -->\nerr");
        return cb(err);
      }
      try {
        return cb(null, parser(data));
      } catch (err) {
        console.error(this + ".autoload(" + id + ", " + typeof cb + ") -->\nerr");
        return cb(err);
      }
    });
  };
  prototype.processBody = function(req, res){
    var data;
    if (!req.body) {
      res.send({
        result: "error",
        message: "Data required!"
      }, 501);
      return false;
    }
    data = req.body;
    data.slug || (data.slug = data.id);
    data.id || (data.id = data.slug);
    if (!data.slug) {
      res.send({
        result: "error",
        message: "Slug required!"
      }, 501);
      return false;
    }
    if (!exists(this.dataDir)) {
      mkdirp(this.dataDir);
    }
    return data;
  };
  prototype.errorHandler = function(res, msg){
    return function(err){
      var msg;
      if (err) {
        msg || (msg = err.message || String(err));
        console.error(msg);
        return res.send({
          result: "error",
          message: msg
        }, 501);
      } else {
        return res.send({
          result: "ok"
        });
      }
    };
  };
  return FileBackedController;
}(Controller));
module.exports = exports = FileBackedController;
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}