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

  function extend(targetObj, sourceObj, deep) {
    for (var propName in sourceObj) { var propValue = sourceObj[propName];
      if (deep && typeof propValue === 'object') { targetObj[propName] = targetObj[propName] || {};
        extend(targetObj[propName], propValue, 'deep'); } else { targetObj[propName] = propValue; } }
    return targetObj;
  }

  function clone(obj) { return extend({}, obj || {}, 'deep'); }

  function upperFirst(string) { return string[0].toUpperCase() + string.slice(1); }


  //// HAPPY STATE SERVICE
  function State(model) { this.model = model; this.data = {}; this.isHappy = true; this.isModified = false; }
  State.prototype = {
    copy: function(key) { var val = this.get(key); return (typeof val === 'object') ? clone(val) : val; },
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


  //// HAPPY VIEW SERVICE
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


  //// HAPPY CONTROLLER
  function Controller() {}
  Controller.prototype = {
  };


  //// HAPPY ELEMENT
  function HappyElement(parent, opt) {
    opt = opt || {};
    this.parent = parent;
    this.$state = new State(this);
    this.$view  = new View(this);
    this.controller = new Controller();
    if (opt.as) { extend(this, opt.as, 'deep'); delete opt.as; }
    this.opt = extend(this.opt || {}, opt); // Allows overriding ext options.
    this.el = this.getEl();
    this.id = this.opt.id || this.getId();
    this.children = this.getChildren();
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
      var children = [], self = this, $view = this.$view, defType = this.getO('defaultChildType');
      this.childNodes = $view.findElAll(this.getO('childSelector'), this.el);
      this.childNodes.forEach(function(elChild) {
        var child, childType = $view.getType(elChild, defType), opt = { el: elChild };
        if ($happy[childType]) { opt.as = $happy[childType]; }
        else if ($happy[defType]) { opt.as = $happy[defType]; }
        child = new HappyElement(self, opt);
        //window.console.log('getChildren(), defType:', defType, ',childType:', childType, elChild, child);
        children.push(child);
      });
      return children;
    },
    addEl: function(happyElement) { this.children.push(happyElement); }
  };


  //// HAPPY FORM
  var Form = {
    happyType: 'form',
    addEl: function(child) { this.children.push(child); this.fields[child.id] = child; },
    opt: {
      selector: 'form',
      childSelector: '.field',
      defaultChildType: 'Field',
      onInit: function(self) { self.fields = {};
        self.children.forEach(function(child) { self.fields[child.id] = child; });
      },
      $state: {
        get: function(key, defaultVal) { return this.data[key] || defaultVal; },
        init: function(data) { this.initial = data; return this.data = clone(data); }
      }
    }
  };


  // HAPPY FIELD
  var Field = {
    happyType: 'field',
    opt: {
      selector: 'field',
      childSelector: '.input',
      defaultChildType: 'Input',
      onInit: function(self) { self.inputs = {};
        self.children.forEach(function(child) { self.inputs[child.id] = child; });
      }
    }
  };


  // HAPPY INPUT
  var Input = {
    happyType: 'input',
  };


  // HAPPY MESSAGE
  var Message = {
    happyType: 'message',
  };


  extend(window.$happy, { HappyElement, Form, Field, Input, Message, isSame, extend, clone });

  window.$happy.extend = function (blueprint, extension) {
    return extend(clone(blueprint), extension || {}, 'deep');
  };


}(window.F1, window.$happy));