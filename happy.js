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

  function clone(obj) { if (!obj) { return obj; } return extend(new obj.constructor, obj, 'deep'); }

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
    getModified: function() { return this.isModified = isSame(this.data, this.initial); },
    getHappy: function(reason, event) { return this.model.validate ? this.model.validate(reason, event) : this.isHappy; },
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


  ////// HAPPY ELEMENT ///////
  function HappyElement(parent, opts) {
    opts = opts || {};
    this.parent = parent;
    this.$state = new State(this);
    this.$view  = new View(this);
    if (opts.as) { extend(this, opts.as, 'deep'); delete opts.as; }
    // window.console.log('init(), constructor opts:', opts, ', this:', this);
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
    getParent: function(happyType) { var self = this.parent; while (self) { if (self.happyType === happyType) { return self; } self = self.parent; } },
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
    createMessages: function(reason, errors, opts) { var self = this;
      errors.forEach(function(error) { self.messages.push(new Message(self, 'error', error, opts)); }); },
    triggerEvent: function(eventName, args) { var handlers = this[eventName] || {};
      for (var i in handlers) { var handler = handlers[i];
        if (typeof handler === 'function' && (r = handler.apply(this, args))) { return r; } }
    }
  };


  //////// MESSAGE /////////
  function Message(parent, type, text, opts) { this.info = parent.messageTypes[type]; this.text = text; this.opts = opts; this.$view = new View(this); }
  Message.prototype = { happyType: 'message',
    mount: function() { var anchorSelector = this.info[1], elContext = this.info[0], mountStyle = this.info[2], elMsg = this.$view.make(),
      elAnchor = this.$view.findEl(anchorSelector, elContext, elContext); elMsg.className = this.opts.className || 'message ' + this.type;
    elMsg.innerHTML = this.text; return this.$view.mount(elMsg, elAnchor, mountStyle); }
  };


  /////// VALIDATOR ////////
  function Validator(id, props) {
    this.id = id; this.validateFn = props.validateFn;
    this.messagesFn = props.messagesFn || function () { return ['invalid']; };
    this.summaryMessagesFn = props.summaryMessagesFn || this.messagesFn;
    this.argsFn = props.argsFn || function () { return props.args || {}; };
  }
  Validator.prototype = { modelType: 'validator',
    validate: function(model, reason, event) { return this.validateFn(model, reason, event); },
    getMessages: function(model, reason, event) { return this.messagesFn(model, reason, event); },
    getSummaryMessages: function(model, reason, event) { return this.summaryMessagesFn(model, reason, event); },
    getArgs: function(model, reason, event) { return this.argsFn(model, reason, event); }
  };


  ////// VALIDATABLE ///////
  var Validatable = { happyType: 'validatable', validators: [], errors: [], messages: [],
    validate: function(reason, event) { var self = this, errors = [], childErrors = [];
      // window.console.log(this.happyType + '::validate(), reason:', reason, ', event:', event);
      this.children.forEach(function(child){ if (child.validate) { childErrors = child.validate(reason, event); } });
      // window.console.log(this.happyType + '::validate(), validators =', this.validators);
      this.validators.forEach(function(validator) { errors = errors.concat(validator.validate(self, reason, event)); });
      // window.console.log(this.happyType + '::validate(), currentErrors =', this.errors, ', childErrors =', childErrors, ', newErrors =', errors);
      this.errors = this.errors.concat(childErrors, errors);
      window.console.log(this.happyType + '::validate(), errors =', this.errors);
      return this.errors;
    },
    $view: {
      getValidators: function() { return this.model.el.required ? [new Validator('required', Required)] : []; },
      getLabel: function() { return this.model.el.getAttribute('data-label'); }
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
    validateFn: function(model) { var val = model.$state.get('value') + ''; return val.length > 0 ? this.getMessages(model) : []; },
    messagesFn : function(model) { var label = model.$view.getLabel(); return [label ? label + ' is required.' : 'required']; }
  };


  extend($happy, { HappyElement, Validator, Validatable, Form, Field, Input, Message, isSame, extend, clone, extendPlugin });

}(window.F1, window.$happy));