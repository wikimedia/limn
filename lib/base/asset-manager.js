var op, ReadyEmitter, AssetManager, _ref, _;
_ref = require('kraken/util'), _ = _ref._, op = _ref.op;
ReadyEmitter = require('kraken/util/event').ReadyEmitter;
AssetManager = (function(superclass){
  AssetManager.displayName = 'AssetManager';
  var prototype = __extend(AssetManager, superclass).prototype, constructor = AssetManager;
  prototype.assets = null;
  /**
   * @constructor
   */;
  function AssetManager(){
    superclass.apply(this, arguments);
    this.assets = {};
  }
  /**
   * Load the corresponding chart specification, which includes
   * info about valid options, along with their types and defaults.
   */
  prototype.load = function(){
    var proto, _this = this;
    if (this.ready) {
      return this;
    }
    proto = this.constructor.prototype;
    jQuery.ajax({
      url: this.SPEC_URL,
      success: function(spec){
        proto.spec = spec;
        proto.options_ordered = spec;
        proto.options = _.synthesize(spec, function(it){
          return [it.name, it];
        });
        proto.ready = true;
        return _this.emit('ready', _this);
      },
      error: function(it){
        return console.error("Error loading " + _this.typeName + " spec! " + it);
      }
    });
    return this;
  };
  return AssetManager;
}(ReadyEmitter));
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}