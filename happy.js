/**
 * Welcome to Happy JS v2
 * C. Moller
 * 24 Sep 2020
 */

window.F1 = window.F1 || {};

window.$happy = window.$happy || {};


(function(F1, $happy){

  $happy.nextIds = [];
  $happy.eventListeners = [];

  function nextId(g) { $happy.nextIds[g] = $happy.nextIds[g] || 1; return g + '_' + $happy.nextIds[g]++; }

  function isArray(obj) { return (/Array/).test(Object.prototype.toString.call(obj)); }

  function isExtendable(v) { return v !== undefined && typeof v === 'object' && v !== null && v.nodeName === undefined; }

  function extend(objTarget, objSource, deep, depth) { depth = depth || 0; if (depth > 5) { return objTarget; }
    for (var prop in objSource) { var srcVal = objSource[prop];
      if (isExtendable(srcVal)) { srcVal = isArray(srcVal) ? srcVal.slice(0) : clone(srcVal); }
      if (deep && isExtendable(objTarget[prop])) { extend(objTarget[prop], srcVal, deep, depth + 1); }
      else { objTarget[prop] = srcVal; } } return objTarget;
  }

  function clone(obj) { return obj ? extend(new obj.constructor, obj, 'deep') : obj; }

  function extendPlugin(plugin, extension) { return extend(clone(plugin), extension, 'deep'); }

  function upperFirst(string) { return string[0].toUpperCase() + string.slice(1); }

  function isSame(obj1, obj2) { var i;
    for (i in obj1) { if (obj1[i] != obj2[i]) return false; }
    for (i in obj2) { if (obj1[i] != obj2[i]) return false; }
    return true;
  }


  /////// HAPPY STATE ///////
  function State(model) { this.model = model; this.data = {}; this.isHappy = true; this.isModified = false; }
  State.prototype = {
    copy: function(key) { var val = this.get(key); return (val && val.constructor === Object) ? clone(val) : val; }, // NOTE: doesn't clone arrays!
    get: function(key, defaultVal) { return this.data[key] || defaultVal; },
    set: function(key, val, init) { if (init) { this.initial[key] = val; } return this.data[key] = clone(val);  },
    reset: function(key) { return key ? this.data[key] = this.initial[key] : this.data = clone(this.initial); },
    init: function(data) { this.initial = data; return this.data = clone(data); },
    update: function(/*reason, event, opts*/) {},
    getModified: function() { return this.isModified = isSame(this.data, this.initial); },
    mapDataIn: function(data) { return data; },
    mapDataOut: function(data) { return data; },
    store: function(opts) { return opts; }, // opts.ajaxUrl or opts.localStorageKey
    fetch: function(opts) { return opts; }
  };


  //////// HAPPY VIEW ////////
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
    make: function(id, className, tag) { var el = document.createElement(tag || 'div');
      if (id) { el.id = id; } if (className) { el.className = className; } return el; },
    remove: function(el) { return this.el.parentElement.removeChild(el); },
    mount: function(elView, elAnchor, mountStyle) {
      elView = elView || this.make(); elAnchor = elAnchor || document.body;
      switch(mountStyle) {
      case 'before': elAnchor.parentElement.insertBefore(elView, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(elView, elAnchor.nextSibling); break;
      default: elAnchor.appendChild(elView); }
      return elView;
    },
    update: function(reason, event, opts) {
      this.model.createMessages(reason, event, this.model.errors, opts);
      this.model.messages.forEach(message => message.mount());
      return this.model.$state.getModified();
    },
  };


  //////// HAPPY MESSAGE /////////
  function Message(text, opts) { this.text = text; this.$view = new View(this); extend(this, opts); }
  Message.prototype = { happyType: 'message',
    getAnchor: function(anchorSelector, elContext) { return this.$view.findEl(anchorSelector, elContext, window.document); },
    mount: function(elMsg, elAnchor, mountStyle) { elAnchor = elAnchor || this.getAnchor(this.anchorSelector, this.elContext);
      mountStyle = mountStyle || this.mountStyle; this.el = elMsg || this.$view.make(this.id, this.className || 'message');
      this.el.innerHTML = this.text; return this.$view.mount(this.el, elAnchor, mountStyle); },
    remove: function() { this.$view.remove(this.el); }
  };


  /////// HAPPY VALIDATOR ////////
  function Validator(id, props) {
    this.id = id; this.validateFn = props.validateFn;
    this.messageFn = props.messageFn || function () { return this.message = 'invalid'; };
    this.altMessageFn = props.altMessageFn; // E.g. For summary display
    this.argsFn = props.argsFn || function () { return props.args || []; };
  }
  Validator.prototype = { happyType: 'validator',
    validate: function(model, reason, event) { return this.validateFn(model, reason, event); },
    getMessage: function(model, reason, event) { return this.messageFn(model, reason, event); },
    getAltMessage: function(model, reason, event) { return this.altMessageFn ? this.altMessageFn(model, reason, event): ''; },
    getArgs: function(model, reason, event) { return this.argsFn(model, reason, event); }
  };


  ////// HAPPY ELEMENT ///////
  function HappyElement(parent, opts) {
    opts = opts || {};
    this.parent = parent;
    this.$state = new State(this);
    this.$view  = new View(this);
    if (opts.as) { extend(this, opts.as, 'deep'); delete opts.as; }
    if (this.triggerEvent('beforeInit', [opts])) { return; }
    this.opts = extend(this.opts || {}, opts); // Allows overriding ext optsions.
    this.el = this.getEl();
    this.id = this.opts.id || this.getId();
    this.childNodes = []; this.children = this.getChildren();
    this.messageTypes = this.opts.messageTypes || this.getMessageTypes();
    this.$state.init({ value: this.opts.val ? this.$view.setVal(this.opts.val) : this.getVal() });
    this.triggerEvent('onInit');
  }
  HappyElement.prototype = {
    happyType: 'element',
    getO: function(opts, defaultVal) { return this.opts[opts] || defaultVal; },
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
    getParent: function(happyType) { var self = this.parent; while (self) {
      if (self.happyType === happyType) { return self; } self = self.parent; } },
    getChildren: function() {
      var children = [], self = this, $view = this.$view, defType = this.getO('defaultChildType'),
        childNodes = $view.findElAll(this.getO('childSelector'), this.el);
      childNodes.forEach(function(elChild) {
        var child, childType = $view.getType(elChild, defType), opts = { el: elChild };
        if ($happy[childType]) { opts.as = $happy[childType]; }
        else if ($happy[defType]) { opts.as = $happy[defType]; }
        child = new HappyElement(self, opts);
        self.childNodes.push(elChild);
        children.push(child);
      });
      return children;
    },
    addEl: function(self, happyElement) { self.children.push(happyElement); self.childNodes.push(happyElement.el); },
    getMessageTypes: function() { var form = this.getParent('form') || this;
      return { 'error': [this.el, '.errors', 'append'], 'summary': [form.el, '.actions', 'before'] }; },
    createMessages: function(reason, event, errors, opts) { var self = this;
      errors.forEach(function(error) { self.messages.push( new Message( error.msg, { anchorSelector: opts.anchorSelector, elContext: self.el }) ); });
    },
    triggerEvent: function(eventName, args) { var r, handlers = this[eventName] || {};
      for (var i in handlers) { var handler = handlers[i];
        if (typeof handler === 'function' && (r = handler.apply(this, args))) { return r; } }
    }
  };


  ////// VALIDATABLE ///////
  var Validatable = { happyType: 'validatable', validators: [], errors: [], messages: [],
    validate: function(reason, event) { var self = this, results = [];
      this.children.forEach(function(child){ if (child.validate) { results = results.concat(child.validate(reason, event)); } });
      this.validators.forEach(function(validator) { results.push(validator.validate(self, reason, event)); });
      // window.console.log(this.happyType + '::validate(), results =', results);
      results.forEach(function(result, i) { results[i] = self.parseValidateResult(result); });
      this.isHappy = !results; return this.errors = results;
    },
    parseValidateResult: function(result) { return result; },
    $view: {
      isLabel: function(el) { return el && el.nodeName === 'LABEL'; },
      getLabel: function() {
        var model = this.model, el = model.el, elParent = model.parent ? model.parent.el : el.parentElement, elLabel;
        if (model.happyType === 'input') { elLabel = this.isLabel(el.previousElementSibling) ? el.previousElementSibling
          : (this.isLabel(el.nextElementSibling) ? el.nextElementSibling : elParent.querySelector('label')); }
        else { elLabel = this.isLabel(el.firstElementChild) ? el.firstElementChild : el.querySelector('label'); }
        model.label = elLabel ? elLabel.innerHTML : el.getAttribute('data-label');
        // window.console.log('gelLabel(), label:', model.label, ', elLabel:', elLabel, ', elParent:', elParent, ', el:', el);
        return model.label;
      },
      getValidators: function() { return this.model.el.required ? [new Validator('required', Required)] : []; }
    },
    onInit: { validatable: function() { this.validators = this.getO('validators') || this.$view.getValidators(); } }
  };


  //////// FORM /////////
  var Form = extendPlugin(Validatable, { happyType: 'form',
    addEl: function(child) { HappyElement.prototype.addEl(this, child); this.fields[child.id] = child; },
    opts: { selector: 'form', childSelector: '.field', defaultChildType: 'Field' },
    onInit: { form: function() { var self = this; this.fields = {}; this.children.forEach(function(child) { self.fields[child.id] = child; });
      window.console.log('Form::errors =', self.errors); } }
  });


  //////// FIELD /////////
  var Field = extendPlugin(Validatable, { happyType: 'field',
    opts: { selector: '.field', childSelector: '.input', defaultChildType: 'Input' },
    onInit: { field: function() { var self = this; this.inputs = {}; this.children.forEach(function(child) { self.inputs[child.id] = child; }); } }
  });


  //////// INPUT /////////
  var Input = extendPlugin(Validatable, { happyType: 'input', opts: { selector: '.input' } });


  ////// REQUIRED ///////
  var Required = {
    validateFn: function(model) { var val = model.$state.get('value') || ''; if (!val && val !== 0) {
      var msg = this.getMessage(model); return { owner: model, msg, altMsg: this.getAltMessage(model) || msg, val }; } },
    messageFn : function(model) { var label = model.$view.getLabel();
      return (label ? label : model.happyType) + ' is required.'; }
  };


  extend($happy, { HappyElement, Validator, Validatable, Form, Field, Input, Message, isSame, extend, clone, extendPlugin });

}(window.F1, window.$happy));