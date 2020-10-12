// HappyJS v9, By: C. Moller, Date: 24 Sep 2020
window.$happy = window.$happy || {};

(function($happy){

  $happy.nextIds = [];

  function clone(obj) { return obj ? extend(new obj.constructor, obj, 'deep') : obj; }
  function empty(obj) { for (var i in obj) { if (obj[i] !== undefined) { return false; } } return true; }
  function copy(val) { return isExtendable(val) ? ( val.constructor === Object ? clone(val) : val.slice(0) ) : val; }
  function extendCloneOf(obj, extension) { return extend(clone(obj), extension, 'deep'); }
  function extend(objTarget, objSource, deep, depth) { depth = depth || 0; if (depth > 5) { return objTarget; }
    for (var prop in objSource) { var srcVal = objSource[prop];
      if (isExtendable(srcVal)) { srcVal = isArray(srcVal) ? srcVal.slice(0) : clone(srcVal); }
      if (deep && isExtendable(objTarget[prop])) { extend(objTarget[prop], srcVal, deep, depth + 1); }
      else { objTarget[prop] = srcVal; } } return objTarget; }
  function isArray(obj) { return (/Array/).test(Object.prototype.toString.call(obj)); }
  function isExtendable(v) { return v !== undefined && typeof v === 'object' && v !== null && v.nodeName === undefined; }
  function nextId(g) { $happy.nextIds[g] = $happy.nextIds[g] || 1; return g + '_' + $happy.nextIds[g]++; }
  function rateLimit(context, fn, params, interval) { const date = new Date(), now = date.getTime();
    if ((now - (context.lastUpdated || 0)) > interval) { context.lastUpdated = now; fn.apply(context, params); } }
  function upperFirst(string) { return string[0].toUpperCase() + string.slice(1); }

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


  /////// HAPPY STATE ///////
  function State(model) { this.model = model; this.data = {}; }
  State.prototype = {
    copy: function(key) { var val = this.get(key); return copy(val); }, // NOTE: doesn't deep-clone arrays!
    get: function(key, defaultVal) { var val = this.data[key]; return val !== undefined ? val : defaultVal; },
    set: function(key, val) { return this.data[key] = val; },
    reset: function(key) { return key ? this.data[key] = copy(this.initial[key]) : this.data = copy(this.initial); },
    mapDataIn: function(data) { return data; },
    mapDataOut: function(data) { return data; },
    store: function(opts) { return opts; }, // opts.ajaxUrl or opts.localStorageKey
    fetch: function(opts) { return opts; }
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
    make: function(id, className, tag) { var el = document.createElement(tag || 'div');
      if (id) { el.id = id; } if (className) { el.className = className; } return el; },
    mount: function(elView, elAnchor, mountStyle) {
      elView = elView || this.make(); elAnchor = elAnchor || document.body;
      switch(mountStyle) {
      case 'before': elAnchor.parentElement.insertBefore(elView, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(elView, elAnchor.nextSibling); break;
      default: elAnchor.appendChild(elView); }
      return elView; },
    remove: function(el) { return this.el.parentElement.removeChild(el); }
  };


  ////// HAPPY ELEMENT ///////
  function HappyElement(parent, opts) {
    //console.log('Construct Happy Element! opts:', opts);
    opts = opts || {};
    this.parent = parent || {};
    this.$state = new State(this);
    this.$view  = new View(this);
    if (opts.as) { extend(this, opts.as, 'deep'); delete opts.as; }
    if (this.triggerEvent('beforeInit', [opts])) { return; }
    this.opts = extend(this.opts || {}, opts); // Allows overriding ext optsions.
    this.el = this.getEl(); this.el.HAPPY = this;
    this.id = this.opts.id || this.getId();
    this.childNodes = []; this.children = this.getChildren();
    this.triggerEvent('onInit');
  }
  HappyElement.prototype = {
    happyType: 'element',
    getO: function(opt, defaultVal) { return this[opt] || this.opts[opt] || defaultVal; },
    getId: function() { return this.el.id ? this.el.id : (this.opts.index ? this.happyType+'_'+this.opts.index : nextId(this.happyType)); },
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
      childNodes.forEach(function(elChild, i) {
        var child, childType = $view.getType(elChild, defType), opts = { el: elChild, index: i+1 };
        if ($happy[childType]) { opts.as = $happy[childType]; }
        else if ($happy[defType]) { opts.as = $happy[defType]; }
        child = new HappyElement(self, opts);
        self.childNodes.push(elChild);
        children.push(child);
      });
      return children;
    },
    triggerEvent: function(eventName, args) { var r, handlers = this[eventName] || {};
      for (var i in handlers) { var handler = handlers[i];
        if (typeof handler === 'function' && (r = handler.apply(this, args))) { return r; } } },
    addEl: function(self, happyElement) { self.children.push(happyElement); self.childNodes.push(happyElement.el); },
    reset: function() { var initialVal = this.$state.reset(); this.$view.setVal(initialVal); },
  };


  //////// MESSAGE /////////
  var Message = { happyType: 'message',
    getAnchor: function(anchorSelector, elContext) { return this.$view.findEl(anchorSelector, elContext, window.document); },
    mount: function(elMsg, elAnchor, mountStyle) { elAnchor = elAnchor || this.getAnchor(this.anchorSelector, this.elContext);
      mountStyle = mountStyle || this.mountStyle; this.el = elMsg || this.$view.make(this.id, this.className || 'message');
      this.el.innerHTML = this.text; return this.$view.mount(this.el, elAnchor, mountStyle); },
    remove: function() { this.$view.remove(this.el); }
  };


  ////// VALIDATABLE ///////
  var Validatable = { happyType: 'validatable',
    $state: {
      setVal: function(val, init) {
        if (init) { this.set('initialVal', val); val = copy(val); }
        var children = this.model.children, deep = isExtendable(val);
        if (children.length) { children.forEach(function(child) { child.$state.setVal(deep ? val[child.id] : val, init); }); }
        this.set('value', val);
        //console.log('$state::setVal(), id:', this.model.id, ', val =', val, ', init =', init);
        return val; },
      setHappy: function(val, init) { return this.set('isHappy', val, init); },
      setErrors: function(errors, init) { return this.set('errors', errors || [], init); },
      setMessages: function(messages, init) { return this.set('messages', messages || [], init); },
      setModified: function(val, init) { return this.set('isModified', val, init); },
      getVal: function(defaultVal) { return this.get('value', defaultVal); },
      getModified: function() { return this.get('isModified', false); },
      getErrors: function() { var errors = this.get('errors', []); return errors; },
      getHappy: function() { return this.get('isHappy', true); },
    },
    $view: {
      format: function(val) { return val; },
      parse: function(val) { return (val || val === 0) ? val : undefined; },
      getVal: function() { var val = {}, model = this.model;
        if (model.children.length > 1) { model.children.forEach(function(child){ val[child.id] = child.$view.getVal(); }); }
        else { val = model.children.length ? model.children[0].$view.getVal() : this.parse(model.el.value); }
        //console.log('$view::getVal(), id:', model.id, ', val =', val);
        return val; },
      getLabel: function() {
        var model = this.model, el = model.el, elParent = model.parent ? model.parent.el : el.parentElement, elLabel;
        if (model.happyType === 'input') { elLabel = this.isLabel(el.previousElementSibling) ? el.previousElementSibling
          : (this.isLabel(el.nextElementSibling) ? el.nextElementSibling : elParent.querySelector('label')); }
        else { elLabel = this.isLabel(el.firstElementChild) ? el.firstElementChild : el.querySelector('label'); }
        model.label = elLabel ? elLabel.innerHTML : el.getAttribute('data-label');
        // window.console.log('gelLabel(), label:', model.label, ', elLabel:', elLabel, ', elParent:', elParent, ', el:', el);
        return model.label; },
      isLabel: function(el) { return el && el.nodeName === 'LABEL'; },
      getValidators: function() { return this.model.el.hasAttribute('required') ? [new Validator('required', Required)] : []; },
      renderMessages: function(messages) { messages.forEach(function(m){ m.mount(); }); },
      renderModified: function(isModified) { this.model.el.classList.toggle('modified', isModified); },
      renderHappy: function(isHappy) { var el = this.model.el; el.classList.toggle('unhappy', !isHappy);
        if (this.isLabel(el.previousElementSibling)) { el.previousElementSibling.classList.toggle('unhappy', !isHappy); } },
      renderVal: function(val) { var self = this, children = this.model.children;
          if (!children.length) { this.model.el.value = this.format(val?val:''); }
          else if (children.length === 1) { children[0].$view.renderVal(this.format(val?val:'')); }
          else if (typeof val === 'object') {
            children.forEach(function(child) { child.$view.renderVal(self.format(val?val[child.id]:'')); }); }
        //console.log('view::renderVal(), id:', this.model.id, ', val =', val);
        return val; }
    },
    initVal: function(val) { var mustGetVal = (val === undefined);
      if (mustGetVal) { val = this.children.length ? this.getValue('onInit') : this.$view.getVal(); }
      if (!mustGetVal || this.children.length ) { this.$view.renderVal(val); }
      return this.$state.setVal(val, 'init'); },
    getValue: function(reason, event, opts) { opts = opts || {};
      var val, children = this.children, deep = (reason !== 'childAsked');
      if (!children.length) { val = opts.update ? this.$view.getVal() : this.$state.getVal(this.defaultVal); }
      else if (children.length === 1) { var child = children[0];
        val = deep ? child.getValue(reason, event, opts) : child.$state.getVal(child.defaultVal); }
      else { val = {}; children.forEach(function(child) {
        val[child.id] = deep ? child.getValue(reason, event, opts) : child.$state.getVal(child.defaultVal); }); }
      if (opts.update) { this.$state.setVal(val); console.log('UpdateVal(), ', this.id, ', reason:', reason, ', opts:', opts, ', val:', val);
        var happy = this.getHappy('childAsked', event, opts); //if (!this.getO('noValidate', opts.noValidate)) {  }
        var modified = this.getModified('childAsked', event, opts); if (modified) { this.$view.renderVal(val); } }
      //console.log('$state::genVal(), id:', this.model.id, ', deep:', deep, ', val =', val);
      return val; },
    getMessages: function() { var errors = this.$state.getErrors(), messages = [];
      errors.forEach(function(err) { messages.push(new Message(err)); }); return messages; },
    getModified: function(reason, event, opts) { opts = opts || {};
      var i, modified = false, children = this.children, deep = (reason !== 'childAsked');
      if (!children.length) { modified = this.$state.getVal() != this.$state.get('initialVal'); }
      else { for (i = 0; i < children.length; i++) { var child = children[i],
        modified = deep ? child.getModified(reason, event, opts) : child.$state.getModified(); if (modified) { break; } } }
      if (opts.update && this.$state.getModified() !== modified) {
        this.$state.setModified(modified); this.$view.renderModified(modified); }
      // window.console.log('$state.genModified(), deep:', deep, ', id:', this.model.id);
      return modified;
    },
    getHappy: function(reason, event, opts) { opts = opts || {}; var happyBefore = this.$state.getHappy(),
      results = this.validate(reason, event, opts), happy = this.$state.getHappy();
      if (opts.update && happy !== happyBefore) { this.$view.renderHappy(happy); }
      // window.console.log(this.happyType + '::getHappy(), results =', results, ', happyBefore:', happyBefore, ', happy:', happy);
      return happy; },
    validate: function(reason, event, opts) { var self = this, results = [],
      deep = (reason !== 'childAsked'); this.children.forEach(function(child){ if (child.validate) {
        results = results.concat(deep ? child.validate(reason, event, opts) : child.$state.getErrors()); } });
      this.validators.forEach(function(validator) { var r = validator.validate(self, reason, event, opts); if (r) { results.push(r); } });
      this.$state.setErrors(results); this.$state.setHappy(results ? !results.length : true);
      // window.console.log(this.happyType + '::validate(), results =', results);
      return results; },
    update: function(reason, event, opts) { opts = opts || {}; opts.update = true; this.getValue(reason, event, opts);
      if (this.parent.update) { this.parent.update('childAsked', event, opts); }
    },
    onInit: { validatable: function() {
      this.messageTypes = { validate: { anchorSelector: '.input', mount: 'after', context: 'parent' } };
      this.validators = this.getO('validators') || this.$view.getValidators();
      this.initVal(this.getO('val'));
    } },
  };


  //////// FORM /////////
  var Form = extendCloneOf(Validatable, { happyType: 'form',
    addEl: function(child) { HappyElement.prototype.addEl(this, child); this.fields[child.id] = child;
      this.$state.setVal(this.getValue('childAsked'), 'init'); }, // New child element asked :)
    onFocus: function(event) { var input = event.target.HAPPY; if (!input||input.children.length) { return; }
      var field = input.parent, form = field.parent; input.touched = true; field.touched = true;
      form.currentField = field; console.log('onFocus:', field.id, input.id); },
    onBlur: function(event) { var input = event.target.HAPPY; if (!input||input.children.length) { return; }
      var field = input.parent, form = field.parent; rateLimit(input, input.update, ['onBlurInput', event], 200);
      console.log('onBlur:', field.id, input.id); },
    bindEvents: function() { this.el.addEventListener('focus', this.onFocus, true);
      this.el.addEventListener('blur', this.onBlur, true); },
    unbindEvents: function() { this.el.removeEventListener('blur', this.onBlur, true);
      this.el.removeEventListener('focus', this.onFocus, true); },
    opts: { selector: 'form', childSelector: '.field', defaultChildType: 'Field' },
    onInit: { form: function() { var self = this; this.fields = {};
      this.children.forEach(function(child) { self.fields[child.id] = child; });
      this.bindEvents(); } },
  });


  //////// FIELD /////////
  var Field = extendCloneOf(Validatable, { happyType: 'field',
    opts: { selector: '.field', childSelector: '.input', defaultChildType: 'Input' },
    onInit: { field: function() { var self = this; this.inputs = {};
      this.children.forEach(function(child) { self.inputs[child.id] = child; }); }
    },
  });


  //////// INPUT /////////
  var Input = extendCloneOf(Validatable, { happyType: 'input', opts: { selector: '.input' } });


  ////// REQUIRED VALIDATOR ///////
  var Required = {
    validateFn: function(model) { var val = model.$state.getVal(); if (val === undefined || empty(val)) {
      var msg = this.getMessage(model); return { owner: model, msg, altMsg: this.getAltMessage(model) || msg, val }; } },
    messageFn : function(model) { var label = model.$view.getLabel(); return (label ? label : model.happyType) + ' is required.'; }
  };


  extend($happy, { HappyElement, Validator, Validatable, Form, Field, Input, Message, isExtendable,
    isArray, empty, extend, clone, copy, extendCloneOf, rateLimit, upperFirst });

}(window.$happy));