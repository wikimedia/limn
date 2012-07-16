var CWD, WWW, VAR, STATIC, VERSION, fs, path, yaml, jade, NODE_ENV, IS_PROD, IS_TEST, IS_DEV, SOURCES_ENV, sources, joinTree, _;
CWD = exports.CWD = process.cwd();
WWW = exports.WWW = CWD + "/www";
VAR = exports.VAR = CWD + "/var";
STATIC = exports.STATIC = CWD + "/static";
VERSION = 'HEAD';
try {
  VERSION = require('../version');
} catch (e) {}
exports.VERSION = exports.version = VERSION;
fs = exports.fs = require('fs');
path = exports.path = require('path');
_ = exports._ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
yaml = exports.yaml = require('js-yaml');
jade = exports.jade = require('jade');
exports.env = process.env;
NODE_ENV = exports.NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();
IS_PROD = exports.IS_PROD = NODE_ENV === 'production';
IS_TEST = exports.IS_TEST = NODE_ENV === 'test';
IS_DEV = exports.IS_DEV = !(IS_PROD || IS_TEST);
SOURCES_ENV = process.env.LIMN_FORCE_BUNDLES ? 'production' : NODE_ENV;
/**
 * Reify a modules.yaml file
 */
sources = exports.sources = function(modulesFile, node_env){
  var mods, modlist;
  node_env == null && (node_env = SOURCES_ENV);
  mods = yaml.load(fs.readFileSync(modulesFile, 'utf8'));
  modlist = (mods.all || []).concat(mods[node_env] || []);
  return _.flatten(modlist.map(function(_arg){
    var suffix, paths;
    suffix = _arg.suffix || '', paths = _arg.paths;
    return joinTree('', paths).map(function(it){
      return it + suffix;
    });
  }));
};
joinTree = exports.joinTree = (function(){
  function joinTree(root, tree){
    if (typeof tree === 'string') {
      return [root + "/" + tree];
    }
    return _(tree).reduce(function(acc, branch){
      if (typeof branch === 'string') {
        acc.push(root + "/" + branch);
      } else {
        _.each(branch, function(v, k){
          return acc.push.apply(acc, joinTree(root + "/" + k, v));
        });
      }
      return acc;
    }, []);
  }
  return joinTree;
}());