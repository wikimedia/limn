var _, setupQUnitThemepicker;
_ = require('underscore');
setupQUnitThemepicker = function($){
  var theme_root, themes, $picker, i$, len$, theme;
  theme_root = limn_config.mount + "test/qunit/themes";
  themes = ['qunit', 'gabe', 'ninja', 'nv'];
  $picker = $('<select id="qunit-themepicker"></select>');
  for (i$ = 0, len$ = themes.length; i$ < len$; ++i$) {
    theme = themes[i$];
    $picker.append("<option value='" + theme + "'>" + theme + ".css</option>");
  }
  $('#qunit').on('change', '#qunit-themepicker', function(evt){
    var theme, $theme_link;
    theme = $(this).val();
    console.log("Changing QUnit theme to " + theme);
    $theme_link = $("head link[rel='stylesheet'][href^='" + theme_root + "']");
    if (!$theme_link.length) {
      console.error("Unable to find current theme!");
    }
    $theme_link.remove();
    return $('head').append("<link rel='stylesheet' href='" + theme_root + "/" + theme + ".css' />");
  });
  return $('<div id="qunit-themepicker-container"><label>Theme:</label> </div>').append($picker).appendTo('#qunit #qunit-testrunner-toolbar');
};
jQuery(function($){
  return setTimeout(function(){
    return setupQUnitThemepicker($);
  }, 250);
});