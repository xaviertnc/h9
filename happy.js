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

  function copy(val) { return isExtendable(val) ? ( val.constructor === Object ? clone(val) : val.slice(0) ) : val; }

  function extendPlugin(plugin, extension) { return extend(clone(plugin), extension, 'deep'); }

  function upperFirst(string) { return string[0].toUpperCase() + string.slice(1); }

  function isSame(obj1, obj2) { var i;
    for (i in obj1) { if (obj1[i] != obj2[i]) return false; }
    for (i in obj2) { if (obj1[i] != obj2[i]) return false; }
    return true;
  }


  /////// HAPPY STATE ///////
  function State(model) { this.model = model; this.data = {}; this.initial = {}; }
  State.prototype = {
    copy: function(key) { var val = this.get(key); return copy(val); }, // NOTE: doesn't deep-clone arrays!
    get: function(key, defaultVal) { return this.data[key] || defaultVal; },
    set: function(key, val, init) { if (init) { this.initial[key] = val; } return this.data[key] = copy(val);  },
    reset: function(key) { return key ? this.data[key] = copy(this.initial[key]) : this.data = copy(this.initial); },
    getVal: function(defaultVal) { var val, children = this.model.children;
      if (children.length === 0) { val = this.get('value', defaultVal); }
      else if (children.length === 1) { val = children[0].$state.getVal(); }
      else { val = {}; children.forEach(function(child){ val[child.id] = child.$state.getVal(); }); } 
      console.log('$state::getVal(), id:', this.model.id, ', val =', val);
      return val; },
    setVal: function(val, init) { var val = this.set('value', val, init);
      console.log('$state::setVal(), id:', this.model.id, ', val =', val);
      return val; },
    getHappy: function() { return this.get('isHappy', true); },
    setHappy: function(val, init) { return this.set('isHappy', val, init); },
    getErrors: function() { return this.get('errors', []); },
    setErrors: function(errors, init) { return this.set('errors', errors, init); },
    getModified: function() { if (children.length === 0) { return ! isSame(this.data, this.initial); } var self = this;
     for (var i in self.model.children) { var child = self.model.children[i]; if (child.$state.getModified()) { return true; } }
    },
    mapDataIn: function(data) { return data; },
    mapDataOut: function(data) { return data; },
    store: function(opts) { return opts; }, // opts.ajaxUrl or opts.localStorageKey
    fetch: function(opts) { return opts; },
    // "parent update" is the important part about "update" methods!
    updateVal: function(reason, event, opts) { this.set('value', this.model.$view.getVal(reason, event, opts));
      if (this.model.parent.$state) { this.model.parent.$state.updateVal('childAsked', event, opts); } },
    updateHappy: function(reason, event, opts) { if (this.model.validate) { this.model.validate(reason, event, opts); }
      if (this.model.parent.$state) { this.model.parent.$state.updateHappy('childAsked', event, opts); } },
    updateModified: function(reason, event, opts) { this.getModified();
      if (this.model.parent.$state) { this.model.parent.$state.updateModified('childAsked', event, opts) } },
    update: function(reason, event, opts) {
      this.updateVal(reason, event, opts);
      this.updateHappy(reason, event, opts);
      this.updateModified(reason, event, opts); }
  };


  //////// HAPPY VIEW ////////
  function View(model) { this.model = model; }
  View.prototype = {
    findEl: function(selector, elContext, elDefault) { elContext = elContext || document;
      return selector ? elContext.querySelector(selector) : elDefault; },
    findElAll: function(selector, elContext) { elContext = elContext || document;
      return elContext.querySelectorAll(selector); },
    getType: function(el, defaultType) {
      var type = el.getAttribute('data-type'); if (type) { return type; }
      type = el.getAttribute('type'); if (type) { return upperFirst(type); }
      return defaultType; },
    parse: function(val) { return val; },
    getVal: function() { var val = {}, model = this.model;
      if (model.children.length > 1) { model.children.forEach(function(child){ val[child.id] = child.$view.getVal(); }); }
      else { val = model.children.length ? model.children[0].$view.getVal() : this.parse(model.el.value); }
      console.log('$view::getVal(), id:', model.id, ', val =', val);
      return val; },
    format: function(val) { return val; },
    setVal: function(val, deep) { var self = this, children = this.model.children;
        if ( ! children.length) { this.model.el.value = this.format(val?val:''); }
        else if (deep && children.length === 1) { children[0].$view.setVal(this.format(val?val:'')); }
        else if (deep) { children.forEach(function(child) { child.$view.setVal(self.format(val?val[child.id]:'')); }); }
      console.log('view::setVal(), id:', this.model.id, ', val =', val);
      return val; },
    make: function(id, className, tag) { var el = document.createElement(tag || 'div');
      if (id) { el.id = id; } if (className) { el.className = className; } return el; },
    mount: function(elView, elAnchor, mountStyle) {
      elView = elView || this.make(); elAnchor = elAnchor || document.body;
      switch(mountStyle) {
      case 'before': elAnchor.parentElement.insertBefore(elView, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(elView, elAnchor.nextSibling); break;
      default: elAnchor.appendChild(elView); }
      return elView; },
    remove: function(el) { return this.el.parentElement.removeChild(el); },
    // "parent update" is the most important part about "update"!
    updateModified: function(reason, event, opts) { var $s = this.model.$state, $pv = this.model.parent.$view;
      this.model.el.classList.toggle('modified', (reason === 'childAsked' ? $s.getModified() : $s.isModified));
      if ($pv) { $pv.updateModified('childAsked', event, opts); } },
    updateHappy: function(reason, event, opts) { var $s = this.model.$state, $pv = this.model.parent.$view;
      this.model.el.classList.toggle('unhappy', !(reason === 'childAsked' ? $s.getHappy() : $s.isHappy));
      if (this.model.parent.$view) { this.model.parent.$view.updateHappy('childAsked', event, opts); } },
    updateMessages: function(reason, event, opts) {
      this.model.createMessages(reason, event, this.model.$state.getErrors(), opts).forEach(message => message.mount());
      if (this.model.parent.$view) { this.model.parent.$view.updateMessages('childAsked', event, opts); } },
    update: function(reason, event, opts) {
      this.updateHappy(reason, event, opts);
      this.updateModified(reason, event, opts);
      this.updateMessages(reason, event, opts); },
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
    console.log('Construct Happy Element! opts:', opts);
    opts = opts || {};
    this.parent = parent || {};
    this.$state = new State(this);
    this.$view  = new View(this);
    if (opts.as) { extend(this, opts.as, 'deep'); delete opts.as; }
    if (this.triggerEvent('beforeInit', [opts])) { return; }
    this.opts = extend(this.opts || {}, opts); // Allows overriding ext optsions.
    this.el = this.getEl();
    this.id = this.opts.id || this.getId();
    this.childNodes = []; this.children = this.getChildren();
    this.messageTypes = this.opts.messageTypes || this.getMessageTypes();
    var val = this.opts.val; if (typeof val === 'undefined') {
     if (this.children.length) { val = this.$state.getVal(); this.$state.setVal(val, 'init'); this.$view.setVal(val); }
     else { this.$state.setVal(this.$view.getVal(), 'init');  }
    } else { this.$state.setVal(this.opts.val, 'init'); this.$view.setVal(this.opts.val, 'deep'); }
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
    reset: function() { var initialVal = this.$state.reset(); this.$view.setVal(initialVal); },
    addEl: function(self, happyElement) { self.children.push(happyElement); self.childNodes.push(happyElement.el); },
    getMessageTypes: function() { var form = this.getParent('form') || this;
      return { 'error': [this.el, '.errors', 'append'], 'summary': [form.el, '.actions', 'before'] }; },
    createMessages: function(reason, event, msgData, opts) { var self = this;
      msgData.forEach(function(data) { self.messages.push( new Message( data.msg, { anchorSelector: opts.anchorSelector, elContext: self.el }) ); });
      return this.messages;
    },
    triggerEvent: function(eventName, args) { var r, handlers = this[eventName] || {};
      for (var i in handlers) { var handler = handlers[i];
        if (typeof handler === 'function' && (r = handler.apply(this, args))) { return r; } }
    }
  };


  ////// VALIDATABLE ///////
  var Validatable = { happyType: 'validatable', validators: [], errors: [], messages: [],
    validate: function(reason, event, opts) { var self = this, results = [];
      this.children.forEach(function(child){ if (child.validate) { results = results.concat(child.validate(reason, event, opts)); } });
      this.validators.forEach(function(validator) { results.push(validator.validate(self, reason, event, opts)); });
      // window.console.log(this.happyType + '::validate(), results =', results);
      results.forEach(function(result, i) { results[i] = self.parseValidateResult(result); });
      this.$state.getHappy(results); return this.errors = results;
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


  extend($happy, { HappyElement, Validator, Validatable, Form, Field, Input, Message, isSame, extend, clone, copy, extendPlugin });

}(window.F1, window.$happy));