/**
 * Welcome to Happy JS v2
 * C. Moller
 * 24 Sep 2020
 */

window.F1 = window.F1 || {};

window.$happy = window.$happy || {};

window.$happy.Ext = window.$happy.Ext || {};



(function(F1, $happy){


  var nextIds = [];

  function nextId(group) { nextIds[group] = nextIds[group] || 1; return group + '_' + nextIds[group]++; }

  function isSame(obj1, obj2) { var i;
    for (i in obj1) { if (obj1[i] != obj2[i]) return false; }
    for (i in obj2) { if (obj1[i] != obj2[i]) return false; }
    return true;
  }

  function extend(targetObj, sourceObj, deep) { // NOTE: doesn't deep extend arrays!
    for (var propName in sourceObj) { var propValue = sourceObj[propName];
      if (deep && isObjectLiteral(propValue)) { targetObj[propName] = targetObj[propName] || {};
        extend(targetObj[propName], propValue, 'deep'); } else { targetObj[propName] = propValue; } }
    return targetObj;
  }

  function clone(obj) { return extend({}, obj || {}, 'deep'); }

  function isObjectLiteral(o) { return (!!o) && (o.constructor === Object); };

  function upperFirst(string) { return string[0].toUpperCase() + string.slice(1); }


  //////// STATE /////////
  function State(model) { this.model = model; this.data = {}; this.isHappy = true; this.isModified = false; }
  State.prototype = {
    copy: function(key) { var val = this.get(key); return isObjectLiteral(val) ? clone(val) : val; }, // NOTE: doesn't clone arrays!
    get: function(key, defaultVal) { return this.data[key] || defaultVal; },
    set: function(key, val, init) { if (init) { this.initial[key] = val; } return this.data[key] = clone(val);  },
    reset: function(key) { return key ? this.data[key] = this.initial[key] : this.data = clone(this.initial); },
    init: function(data) { this.initial = data; return this.data = clone(data); },
    getModified: function() { return this.isModified = isSame(this.data, this.initial); },
    getHappy: function(reason, event) { return this.model.validate ? this.model.validate(reason, event) : this.isHappy; },
    mapDataIn: function(data) { return data; },
    mapDataOut: function(data) { return data; },
    store: function(opt) { return opt; }, // opt.ajaxUrl or opt.localStorageKey
    fetch: function(opt) { return opt; }
  };


  //////// VIEW /////////
  function View(model) { this.model = model; }
  View.prototype = {
    findEl: function(selector, elContext, elDefault) { elContext = elContext || document;
      return selector ? elContext.querySelector(selector) : elDefault;
    },
    findElAll: function(selector, elContext) { elContext = elContext || document;
      return elContext.querySelectorAll(selector);
    },
    getType: function(el, defaultType) {
      var type = el.getAttribute('data-type'); if (type) { return type; }
      type = el.getAttribute('type'); if (type) { return upperFirst(type); }
      return defaultType;
    },
    getValidators: function() { return this.model.el.required ? [new Validator('required', ValidateRequired)] : []; },
    getLabel: function() { return this.model.el.getAttribute('data-label'); },
    getVal: function() { return this.model.el.value; },
    setVal: function(val) { this.model.el.value = val; if (this.model.children.length) { this.model.children[0].el.value = val; } },
    make: function() { return document.createElement('div'); },
    mount: function(elView, elAnchor, mountStyle) {
      elView = elView || this.make(); elAnchor = elAnchor || document.body;
      switch(mountStyle) {
      case 'before': elAnchor.parentElement.insertBefore(elView, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(elView, elAnchor.nextSibling); break;
      default: elAnchor.appendChild(elView); }
      return elView;
    }
  };


  //////// CONTROLLER /////////
  function Controller() {}
  Controller.prototype = {
  };


  //////// HAPPY ELEMENT /////////
  function HappyElement(parent, opt) {
    opt = opt || {};
    this.parent = parent;
    this.$state = new State(this);
    this.$view  = new View(this);
    this.controller = new Controller();
    if (opt.as) { extend(this, opt.as, 'deep'); delete opt.as; }
    if (this.opt.beforeInit) { if (this.opt.beforeInit(this, opt)) { return; }}
    this.opt = extend(this.opt || {}, opt); // Allows overriding ext options.
    this.el = this.getEl();
    this.id = this.opt.id || this.getId();
    this.childNodes = []; this.children = this.getChildren();
    this.$state.init({ value: this.opt.val ? this.$view.setVal(this.opt.val) : this.getVal() });
    if (this.opt.onInit) { this.opt.onInit(this); }
  }
  HappyElement.prototype = {
    happyType: 'elm',
    getO: function(opt, defaultVal) { return this.opt[opt] || defaultVal; },
    getId: function() { return this.el.id ? this.el.id : nextId(this.happyType); },
    getEl: function() { var el = this.getO('el'); if (el) { return el; }
      var selector = this.getO('selector'), elContext = this.parent.el || document.body;
      if (selector) { return this.$view.findEl(selector, elContext); }
      return this.$view.mount(null, this.getO('elMount', elContext), this.getO('mountStyle'));
    },
    getVal: function() { if (this.children.length) { var cvs = [];
      this.children.forEach(function(child) { let val = child.getVal(); if (val === 0 || val) { cvs.push(val); } });
      return cvs.join('|'); } return this.$view.getVal();
    },
    getChildren: function() {
      var children = [], self = this, $view = this.$view, defType = this.getO('defaultChildType'),
        childNodes = $view.findElAll(this.getO('childSelector'), this.el);
      childNodes.forEach(function(elChild) {
        var child, childType = $view.getType(elChild, defType), opt = { el: elChild };
        if ($happy[childType]) { opt.as = $happy[childType]; }
        else if ($happy[defType]) { opt.as = $happy[defType]; }
        child = new HappyElement(self, opt);
        //window.console.log('getChildren(), defType:', defType, ',childType:', childType, elChild, child);
        self.childNodes.push(elChild);
        children.push(child);
      });
      return children;
    },
    addEl: function(self, happyElement) { self.children.push(happyElement); self.childNodes.push(happyElement.el); }
  };


  //////// VALIDATOR /////////
  function Validator(id, props) {
    this.id = id; this.validateFn = props.validateFn;
    this.messagesFn = props.messagesFn || function () { return ['invalid']; };
    this.summaryMessageFn = props.summaryMessageFn || this.messageFn;
    this.argsFn = props.argsFn || function () { return props.args || {}; };
  }
  Validator.prototype = { modelType: 'validator',
    validate: function(model, reason, event) { return this.validateFn(model, reason, event); },
    getMessages: function(model, reason, event) { return this.messagesFn(model, reason, event); },
    getSummaryMessage: function(model, reason, event) { return this.sumaryMsgTemplateFn(model, reason, event); },
    getArgs: function(model, reason, event) { return this.argsFn(model, reason, event); }
  };


  //////// REQUIRED /////////
  var ValidateRequired = {
    validateFn: function(model) { var val = model.$state.get('value') + ''; return val.length > 0 ? this.getMessages(model) : []; },
    messagesFn : function(model) { var label = model.$view.getLabel(); return [label ? label + ' is required.' : 'required']; }
  };


  //////// VALIDATABLE /////////
  var Validatable = {  validators: [], errors: [], messages: [],
    validate: function(reason, event) { var self = this, errors = [], childErrors = [];
      // window.console.log(this.happyType + '::validate(), reason:', reason, ', event:', event);
      this.children.forEach(function(child){ if (child.validate) { childErrors = child.validate(reason, event); } });
      this.validators = this.getO('validators') || this.$view.getValidators();
      // window.console.log(this.happyType + '::validate(), validators =', this.validators);
      this.validators.forEach(function(validator) { errors = errors.concat(validator.validate(self, reason, event)); });
      // window.console.log(this.happyType + '::validate(), currentErrors =', this.errors, ', childErrors =', childErrors, ', newErrors =', errors);
      this.errors = this.errors.concat(childErrors, errors);
      window.console.log(this.happyType + '::validate(), errors =', this.errors);
      return this.errors;
    },
  };


  //////// FORM /////////
  var Form = { happyType: 'form',
    addEl: function(child) { HappyElement.prototype.addEl(this, child); this.fields[child.id] = child; },
    opt: { selector: 'form', childSelector: '.field', defaultChildType: 'Field',
      beforeInit: function(self/*, origOpt*/) { extend(self, Validatable, 'deep'); },
      onInit: function(self) { self.fields = {}; self.children.forEach(function(child) { self.fields[child.id] = child; }); console.log('Form::errors =', self.errors); },
    }
  };


  //////// FIELD /////////
  var Field = { happyType: 'field',
    opt: { selector: '.field', childSelector: '.input', defaultChildType: 'Input',
      beforeInit: function(self/*, origOpt*/) { extend(self, Validatable, 'deep'); },
      onInit: function(self) { self.inputs = {}; self.children.forEach(function(child) { self.inputs[child.id] = child; }); }
    }
  };


  //////// INPUT /////////
  var Input = { happyType: 'input',
    opt: { selector: '.input', beforeInit: function(self/*, origOpt*/) { extend(self, Validatable, 'deep'); } }
  };


  //////// MESSAGE /////////
  var Message = {
    happyType: 'message',
  };


  extend(window.$happy, { HappyElement, Validator, Validatable, Form, Field, Input, Message, isSame, extend, clone });

  window.$happy.extend = function (blueprint, extension) { return extend(clone(blueprint), extension || {}, 'deep'); };

}(window.F1, window.$happy));