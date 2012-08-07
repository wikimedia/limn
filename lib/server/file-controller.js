var fs, path, exists, Seq, glob, mkdirp, yaml, readJSONFilesAsync, Controller, FileBackedController, exports, _;
fs = require('fs');
path = require('path');
exists = fs.existsSync || path.existsSync;
_ = require('underscore');
Seq = require('seq');
glob = require('glob');
mkdirp = require('mkdirp');
yaml = require('js-yaml');
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
  prototype.noun = null;
  function FileBackedController(){
    var limnOpts;
    superclass.apply(this, arguments);
    limnOpts = this.app.set('limn options');
    this.dataDir = limnOpts.dataDir + "/" + this.name;
    this.noun == null && (this.noun = this.name.charAt(0).toUpperCase() + this.name.slice(1));
  }
  /**
   * @param {String} id ID of this resource.
   * @returns {String} Glob path to file for this resource.
   */
  prototype.toFile = function(id){
    return this.dataDir + "/**/" + id + ".@(yaml|json)";
  };
  /**
   * Finds the reified filepath for the resource `id`.
   * 
   * @param {String} id ID of this resource.
   * @param {Function} cb Callback `(err, filepath)`.
   */
  prototype.findFile = function(id, cb){
    return glob(this.toFile(id), {
      nocase: true,
      nosort: true
    }, function(err, files){
      if (err) {
        return cb(err);
      }
      if (!files.length) {
        return cb('ENOENT');
      }
      return cb(null, files[0]);
    });
  };
  /**
   * Auto-load :id for related requests by looking up the so-named file in the dataDir.
   * 
   * @param {String} id ID of the resource.
   * @param {Function} cb Callback to invoke with the loaded object.
   */
  prototype.autoload = function(id, cb){
    return Seq().seq(readJSONFilesAsync, this.toFile(id), {
      yaml: true,
      appendExt: false
    }, Seq).seq(function(data){
      return cb(null, _.values(data)[0] || {});
    })['catch'](function(err){
      return cb(null, {});
    });
  };
  prototype.processBody = function(req, res){
    var data;
    if (!req.body) {
      res.send({
        result: "error",
        message: "Data required!"
      }, 400);
      return false;
    }
    data = req.body;
    data.slug || (data.slug = data.id);
    data.id || (data.id = data.slug);
    if (!data.slug) {
      res.send({
        result: "error",
        message: "Slug required!"
      }, 400);
      return false;
    }
    if (!exists(this.dataDir)) {
      mkdirp.sync(this.dataDir);
    }
    return data;
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