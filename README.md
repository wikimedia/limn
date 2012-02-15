# Kraken UI: WMF Analytics Reportcard prototype

Setup instructions to be cleaned up momentarily. (brb lunch)


### Setting Up

This is a [node.js][nodejs] project, so you need node > 0.6.x and the node package manager, [npm][npm].

Once that's done, I recommend you install Coco globally so you don't have to futz with your path: `npm install -g coco` -- if you choose not to, you should probably add `./node_modules/.bin` to `PATH` in your bashrc or something.

Next, install your source checkout in dev mode by running `npm link` from the project root. This will also download and install all the package dependencies.

Finally, start the `server` task using Coke (it's like Rake for Coco) with `coke server`. While this does what it says on the tin, it also seems to have a habit of randomly losing parts of stderr. For now, you can work around this by manually starting the server: `coke link && lib/server/server.co`

You should now have a server running on 8081.


### Notes

- This project is written in [Coco][coco], a dialect of [CoffeeScript][coffee] -- they both compile 
  down to JavaScript. The pair are very, very similar, [except][coco-improvements] 
  for [a few][coco-incompatibilities] [things][coco-vs-coffee]. If you can read JavaScript and Ruby, 
  you can understand Coco and CoffeeScript. (I refer to the [CoffeeScript docs][coffee-docs] for 
  the syntax, and I find the [comparison page][coco-vs-coffee] to be the best reference for Coco.)
  
- Coco require compilation before it'll run in the browser (though node can run it directly -- `#!/usr/bin/env coco` will work as a shebang as well). I've written [request middleware][connect-compiler] that recompiles stale files on demand, and it is pretty cool.
  
- brb lunch



[nodejs]: http://nodejs.org/
[npm]: http://npmjs.org/
[coco]: https://github.com/satyr/coco
[coco-vs-coffee]: https://github.com/satyr/coco/wiki/side-by-side-comparison
[coco-improvements]: https://github.com/satyr/coco/wiki/improvements
[coco-incompatibilities]: https://github.com/satyr/coco/wiki/incompatibilities
[coffee]: http://coffeescript.org/
[coffee-docs]: http://coffeescript.org/#language
[connect-compiler]: https://github.com/dsc/connect-compiler


