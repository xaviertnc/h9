/**
 * Welcome to Happy JS v2
 * C. Moller
 * 24 Sep 2020
 */

window.F1 = window.F1 || {};

window.$happy = window.$happy || {};

$happy.Ext = $happy.Ext || {};



(function(F1, $happy){


const nextIds = [];


function extend(targetObj, sourceObj, deep) {
  for (let propName in sourceObj) { const propValue = sourceObj[propName];
    if (deep && typeof propValue === "object") { targetObj[propName] = targetObj[propName] || {};
      extend(targetObj[propName], propValue, 'deep'); } else { targetObj[propName] = propValue; } }
  return targetObj;
}

function clone(obj) { return extend({}, obj || {}, 'deep'); }

function nextId(group) { nextIds[group] = nextIds[group] || 1; return group + '_' + nextIds[group]++; }

function isSame(obj1, obj2) {
    for (var i in obj1) { if (obj1[i] != obj2[i]) return false; }
    for (var i in obj2) { if (obj1[i] != obj2[i]) return false; }
    return true;
}


//// HAPPY STATE SERVICE
function State(model) { this.model = model; model.data = model.data || {}; this.init(model.data); }
State.prototype = {
  copy: function(key) { let val = this.get(key); return (typeof val === 'object') ? clone(val) : val; },
  get: function(key, defaultVal) { return this.data[key] || defaultVal; },
  set: function(key, val, init) { return this.data[key] = clone(val); if (init) { this.initial[key] = val; } },
  reset: function(key) { return key ? this.data[key] = this.initial[key] : this.data = clone(this.initial); },
  init: function(data) { this.initial = data; return this.data = clone(data); },
  modified: function() { return isSame(this.data, this.initial) },
  happy: function() { return this.model.isHappy; },
  mapDataIn: function(data) { return data; },
  mapDataOut: function(data) { return data; },
  store: function(opt) {}, // opt.ajaxUrl or opt.localStorageKey
  fetch: function(opt) {}
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
  make: function() { return document.createElement('div'); },
  getType: function(el, defaultType) {
    return el.getAttribute('type') || el.getAttribute('data-type') || defaultType;
  },
  mount: function(elView, elAnchor, mountStyle) {
    elView = elView || this.make(); elAnchor = elAnchor || document.body;
    switch(mountStyle) {
      case 'before': elAnchor.parentElement.insertBefore(elView, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(elView, elAnchor.nextSibling); break;
      default: elAnchor.appendChild(elView);
    }
    return elView;
  },
  // parseVal: function(val) { console.log('parseVal:', val); return val; },
  // formatVal: function(val) { console.log('formatVal:', val); return val; },
  parseVal: function(val) { return val; },
  formatVal: function(val) { return val; },
  getVal: function() { return this.parseVal(this.model.el.value); },
  setVal: function(val) { var val = this.formatVal(val); this.model.el.value = val;
    if (this.model.children.length) { this.model.children[0].el.value = val; } },
  update: function() {},
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
  this.$state.init({ value: this.opt.val ? this.$view.setVal(this.opt.val) : this.$view.getVal() });
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
  getChildren: function() {
    var children = [], self = this, $view = this.$view, defType = this.getO('defaultChildType');
    this.childNodes = $view.findElAll(this.getO('childSelector'), this.el);
    this.childNodes.forEach(function(elChild) {
      // console.log('getChildren(), elChild:', elChild);
      var childType = $view.getType(elChild, defType);
      var child = new HappyElement(self, { as: $happy[defType], el: elChild });
      children.push(child);
    });
    return children;
  },
  addEl: function(happyElement) { this.children.push(happyElement); }
};


//// HAPPY FORM
const Form = {
  happyType: 'form',
  addEl: function(child) { this.children.push(child); this.fields[child.id] = child; },
  opt: {
    selector: 'form',
    childSelector: '.field',
    defaultChildType: 'Field',
    onInit: function(self) { self.fields = {};
      self.children.forEach(function(child) { self.fields[child.id] = child; });
    },
  }
};


// HAPPY FIELD
const Field = {
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
const Input = {
  happyType: 'input',
};


// HAPPY MESSAGE
const Message = {
  happyType: 'message',
};


extend(window.$happy, { HappyElement, Form, Field, Input, Message, extend, clone });

window.$happy.extend = function (blueprint, extension) {
    return extend(clone(blueprint), extension || {}, 'deep');
};


}(window.F1, window.$happy));