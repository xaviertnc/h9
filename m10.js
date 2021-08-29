(function(window){

  window.console.log('--- HAPPY 10 READY ---');

  var messages = {};
  var validators = {};

  messages.required = function(l) { return l ? l + ' is required.' : 'required'; };

  messages.title = function(l, a) { return l ? l + ' must be between ' + a[0] + ' and ' + a[1] +
    ' characters long.' : 'field invalid.'; };

  validators.required = function(v, o) { if (!v && v !== 0) { var m = o.getO('messages'),
    l = o.getLabelText(); return m.required ? m.required(l) : 'required'; } };

  validators.title = function(v, o, a) { if (v.length < a[0] || v.length > a[1]) {
    var m = o.getO('messages'), l = o.getLabelText(); return m.title ? m.title(l, a) : 'invalid'; } };

  var HAPPY = new window.Happy({ validators, messages });

  console.log(HAPPY);

}(window));



