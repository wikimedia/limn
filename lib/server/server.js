var fs, path, exec, spawn, exists, express, LimnMiddleware, exports, app, limn, mainfile, PORT, that, NODE_ENV, REV, _ref;
fs = require('fs');
path = require('path');
_ref = require('child_process'), exec = _ref.exec, spawn = _ref.spawn;
exists = fs.existsSync || path.existsSync;
express = require('express');
LimnMiddleware = require('./middleware');
app = exports = module.exports = express.createServer();
/**
 * Handle webhook notification to pull from origin.
 */
app.all('/webhook/post-update', function(req, res){
  var cmd, child;
  cmd = 'git pull origin master';
  console.log("[/webhook/post-update] $ " + cmd);
  return child = exec(cmd, function(err, stdout, stderr){
    res.contentType('.txt');
    console.log('[/webhook/post-update]  ', stdout);
    console.log('[/webhook/post-update]  ', stderr);
    if (err) {
      console.error('[/webhook/post-update] ERROR!', err);
      return res.send("$ " + cmd + "\n\n" + stdout + "\n\n" + stderr + "\n\nERROR! " + err, 503);
    } else {
      return res.send("$ " + cmd + "\n\n" + stdout + "\n\n" + stderr, 200);
    }
  });
});
/**
 * Load Limn middleware
 */
app.use(limn = app.limn = LimnMiddleware());
mainfile = path.basename((_ref = require.main) != null ? _ref.filename : void 8);
if (require.main === module || 'Cokefile' === mainfile) {
  PORT = 8081;
  if (that = process.env.KRAKEN_PORT) {
    PORT = parseInt(that, 10);
  }
  NODE_ENV = process.env.NODE_ENV || 'development';
  REV = process.env.KRAKEN_REV || 'HEAD';
  try {
    REV = require('../version');
  } catch (e) {}
  exec('git rev-parse --short HEAD', {
    cwd: process.cwd(),
    env: process.env
  }, function(err, stdout, stderr){
    var REV, s;
    if (err) {
      throw err;
    }
    if (!REV) {
      REV = stdout.trim();
    }
    console.log(s = "Kraken Server (port=" + PORT + ", env=" + NODE_ENV + ", rev=" + REV + ", base_dir=" + limn.BASE + ")");
    console.log(__repeatString('=', s.length));
    return app.listen(PORT);
  });
}
function __repeatString(str, n){
  for (var r = ''; n > 0; (n >>= 1) && (str += str)) if (n & 1) r += str;
  return r;
}