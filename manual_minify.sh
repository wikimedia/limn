rm var/vendor/vendor-bundle.*js
rm var/js/limn.no-deps.*js
coke bundle_vendor
coke bundle_sources
uglifyjs var/vendor/vendor-bundle.js > var/vendor/vendor-bundle.min.js
uglifyjs var/js/limn.no-deps.js > var/js/limn.no-deps.min.js
#cp var/vendor/vendor-bundle.js var/vendor/vendor-bundle.min.js
#cp var/js/limn.no-deps.js var/js/limn.no-deps.min.js
