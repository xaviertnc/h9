// HappyJS v9, By: C. Moller, Date: 24 Sep 2020
window.$happy = window.$happy || {};

(function($happy){

  $happy.lang = {}; $happy.nextIds = [];

  function lang(msgID, message) { var mt = $happy.lang[msgID]; return mt ? mt : message; }
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
  function nextId(g) { $happy.nextIds[g] = $happy.nextIds[g] || 1; return g + $happy.nextIds[g]++; }
  function upperFirst(string) { return string[0].toUpperCase() + string.slice(1); }


  /////// HAPPY VALIDATOR ////////
  function Validator(id, props) {
    this.id = id; this.validateFn = props.validateFn;
    this.messageFn = props.messageFn || function () { return this.message = 'invalid'; };
    this.argsFn = props.argsFn || function () { return props.args || []; };
  }
  Validator.prototype = { happyType: 'validator',
    validate: function(model, reason, event) { return this.validateFn(model, reason, event); },
    getMessage: function(model, reason, event) { return this.messageFn(model, reason, event); },
    getArgs: function(model, reason, event) { return this.argsFn(model, reason, event); }
  };


  /////// HAPPY STATE ///////
  function State(model) { this.model = model; this.data = {}; }
  State.prototype = {
    copy: function(key) { var val = this.get(key); return copy(val); }, // NOTE: doesn't deep-clone arrays!
    get: function(key, defaultVal) { var val = this.data[key]; return val !== undefined ? val : defaultVal; },
    set: function(key, val) { return this.data[key] = val; },
    reset: function(key) { return key ? this.data[key] = copy(this.initial[key]) : this.data = copy(this.initial); },
  };


  //////// HAPPY VIEW ////////
  function View(model) { this.model = model; }
  View.prototype = {
    findEl: function(selector, elContext, elDefault) { elContext = elContext || document;
      return selector ? elContext.querySelector(selector) : elDefault; },
    findElAll: function(selector, elContext) { elContext = elContext || document;
      return selector ? elContext.querySelectorAll(selector) : []; },
    getType: function(el, defaultType) { var type = el.getAttribute('data-type'); if (type) { return type; }
      type = el.getAttribute('type'); if (type) { return upperFirst(type); } return defaultType; },
    getContextEl: function(anchor) { var m = this.model; return anchor.elContext ||
      (anchor.context === 'parent' ? m.el.parentElement : m.el); },
    getAnchorEl: function(anchor) { return anchor.elMount || View.prototype.findEl(
      anchor.selector, this.getContextEl(anchor)) || this.getContextEl(anchor); },
    getMessages: function() { var m = this.model; return View.prototype.findElAll(
      m.getO('msgsSelector', '.messages') + '.' + m.id, this.getContextEl(m.getO('msgsAnchor', {}))); },
    make: function(id, className, tag) { var el = document.createElement(tag || 'div');
      if (id) { el.id = id; } if (className) { el.className = className; } return el; },
    mount: function(anchor, el) { el = el || this.model.el; var elAnchor = this.getAnchorEl(anchor);
      // console.log('mount(), m:', this.model, ', anchor:', anchor, ', el:', el, ', elAnchor:', elAnchor);
      switch(anchor.mountStyle) { case 'prepend': elAnchor.prepend(el); break;
      case 'before': elAnchor.parentElement.insertBefore(el, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(el, elAnchor.nextSibling); break;
      default: elAnchor.append(el); } return el; },
    renderMessages: function(msgs, anchor) { msgs = msgs || []; if (!msgs.length) { return; }
      var m = this.model, elMsgs = View.prototype.make(nextId('msgs'), 'messages ' + m.id);
      anchor = anchor || m.getO('msgsAnchor', {}); this.mount(anchor, elMsgs);
      msgs.forEach(function(msg){ var elMsg = View.prototype.make(msg.id || nextId('msg'), (msg.className || 'message') +
        (msg.type ? ' ' + msg.type : '')); elMsg.innerHTML = msg.text; elMsgs.appendChild(elMsg); }); },
    removeMessages: function() { var msgs = this.getMessages();
      // console.log('removeMessages(), id:', this.model.id, ', msgs:', msgs);
      msgs.forEach(function(el){ View.prototype.remove(el); }); },
    remove: function(el) { return el.parentElement.removeChild(el); }
  };


  ////// HAPPY ELEMENT ///////
  function HappyElement(parent, opts) {
    opts = opts || {};
    this.parent = parent || {};
    this.$state = new State(this);
    this.$view  = new View(this);
    if (opts.as) { extend(this, opts.as, 'deep'); delete opts.as; }
    if (this.triggerEvent('beforeInit', [opts])) { return; }
    this.opts = extend(this.opts || {}, opts); // Allows overriding ext optsions.
    this.el = this.getEl(); this.el.HAPPY = this;
    // console.log('HappyElement::init(), el:', this.el);
    this.id = this.opts.id || this.getId();
    this.childNodes = []; this.children = this.getChildren();
    this.triggerEvent('onInit');
  }
  HappyElement.prototype = {
    happyType: 'element',
    getO: function(opt, defaultVal) { return this[opt] || this.opts[opt] || defaultVal; },
    getId: function() { var pfx = this.parent.id ? (this.parent.id + '_' + this.happyType) : this.happyType;
      return this.el.id ? this.el.id : (this.opts.index ? pfx+this.opts.index : nextId(pfx)); },
    getEl: function() { var el = this.getO('el'); if (el) { return el; } var selector = this.getO('selector');
      if (selector) { return this.$view.findEl(selector, this.parent.el || document); } return this.$view.make(); },
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
      for (var i in handlers) { var handler = handlers[i]; if (typeof handler === 'function' && (r = handler.apply(this, args))) { return r; } } },
    addEl: function(happyElement, mountAnchor) { this.$view.mount(mountAnchor || { elMount: this.el, mountStyle: 'append' }, happyElement.el);
      this.children.push(happyElement); this.childNodes.push(happyElement.el); },
    reset: function() { var initialVal = this.$state.reset(); this.$view.setVal(initialVal); },
  };


  ////// VALIDATABLE ///////
  var Validatable = { happyType: 'validatable',
    $state: {
      setVal: function(val, reason, deep) { var children = this.model.children;
        if (reason === 'init') { this.set('initialVal', val); val = copy(val); }
        if (deep && children.length) {
          if (children.length === 1) { children[0].$state.setVal(val, reason); }
          else { children.forEach(function(child) { child.$state.setVal(
            (typeof val==='object') ? val[child.id] : val, reason, deep); }); }
        } this.set('value', val); return val; },
      setHappy: function(val) { return this.set('isHappy', val); },
      setModified: function(val) { return this.set('isModified', val); },
      getVal: function() { var val = this.get('value'); return val; },
      getHappy: function() { return this.get('isHappy', true); },
      getErrors: function() { var children = this.model.children, errors = [];
        children.forEach(function(c) { errors = errors.concat(c.$state.getErrors()); });
        errors = errors.concat(this.get('errors', [])); return errors; },
      getModified: function() { return this.get('isModified', false); }
    },
    $view: {
      format: function(val) { return val; },
      isLabel: function(el) { return el && el.nodeName === 'LABEL'; },
      parse: function(val) { return (val || val === 0) ? val : undefined; },
      getVal: function() { var val = {}, model = this.model;
        if (model.children.length > 1) { model.children.forEach(function(child){ val[child.id] = child.$view.getVal(); }); }
        else { val = model.children.length ? model.children[0].$view.getVal() : this.parse(model.el.value); } return val; },
      getLabelText: function() { var model = this.model, el = model.el, elParent = model.parent ? model.parent.el : el.parentElement, elLabel;
        if (model.happyType === 'input') { elLabel = this.isLabel(el.previousElementSibling) ? el.previousElementSibling
          : (this.isLabel(el.nextElementSibling) ? el.nextElementSibling : elParent.querySelector('label')); }
        else { elLabel = this.isLabel(el.firstElementChild) ? el.firstElementChild : el.querySelector('label'); }
        model.label = elLabel ? elLabel.innerHTML : el.getAttribute('data-label'); return model.label; },
      getUnhappyInput: function() { return this.model.el.querySelector('.input.unhappy,.field.unhappy input'); },
      getErrorInput: function(error) { var el = error.owner.el; return el.classList.contains('.input') ? el : el.querySelector('.input'); },
      getValidators: function() { return this.model.el.hasAttribute('required') ? [new Validator('required', Required)] : []; },
      renderModified: function(isModified) { var el = this.model.el; el.classList.toggle('modified', isModified);
        if (this.isLabel(el.previousElementSibling)) { el.previousElementSibling.classList.toggle('modified', isModified); } },
      renderHappy: function(isHappy) { var el = this.model.el; el.classList.toggle('unhappy', !isHappy);
        if (this.isLabel(el.previousElementSibling)) { el.previousElementSibling.classList.toggle('unhappy', !isHappy); } },
      renderVal: function(val) { var self = this, children = this.model.children;
        // console.log('renderVal(), val:', val, ', id:', this);
        if (!children.length) { this.model.el.value = this.format(val?val:''); }
        else if (children.length === 1) { children[0].$view.renderVal(this.format(val?val:'')); }
        else if (typeof val === 'object') { children.forEach(function(child) {
          child.$view.renderVal(self.format(val?val[child.id]:'')); }); } return val; },
    },
    calcModified: function(/*reason, event, opts*/) { return this.$state.getVal() != this.$state.get('initialVal'); },
    childrenModified: function(/*reason, event, opts*/) { for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].$state.getModified()) { return true; } } return false; },
    updateModified: function(reason, event, opts) { var modified = (this.children.length > 0)
      ? this.childrenModified(reason, event, opts) : this.calcModified(reason, event, opts);
    if (this.$state.getModified() !== modified && (!this.onModified || !this.onModified(modified))) {
      this.$state.setModified(modified); this.$view.renderModified(modified); } return modified; },
    validate: function(reason, event, opts) { var errors = [], self = this; this.validators.forEach(function(validator) {
      var err = validator.validate(self, reason, event, opts); if (err) { errors.push(err); } }); return errors; },
    childrenHappy: function(/*reason, event, opts*/) { for (var i = 0; i < this.children.length; i++) {
      if (!this.children[i].$state.getHappy()) { return false; } } return true; },
    updateHappy: function(reason, event, opts, childAsked) { var errors = [], happy = true;
      if (this.children.length === 0) { errors = this.validate(reason, event, opts); happy = !errors.length; } else {
        if (childAsked) { happy = this.childrenHappy(reason, event, opts); }
        else { this.children.forEach(function(child){ if (!child.updateHappy(reason, event, opts, childAsked)) { happy = false; } }); }
        if (happy && this.validators.length) { errors = this.validate(reason, event, opts); happy = !errors.length; } }
      if (this.$state.getHappy() !== happy && (!this.onHappy || !this.onHappy(happy, errors))) {
        this.$state.setHappy(happy); this.$view.renderHappy(happy); }
      this.$state.set('errors', errors);
      return happy;
    },
    calcValue: function(/*reason, event, opts*/) { var v;
      if (this.children.length > 1) { v = {}; this.children.forEach(function(c){ v[c.id] = c.$state.getVal(); }); }
      else { v = this.children[0].$state.getVal(); } return v; },
    updateValue: function(reason, event, opts) { var val = (this.children.length > 0) ? this.calcValue(reason, event, opts)
      : this.$view.getVal(); this.$state.setVal(val, reason); return val; },
    update: function(reason, event, opts, childAsked) { opts = opts || {}; var init = (reason === 'init');
      this.updateValue(reason, event, opts); if (!init) { this.updateModified(reason, event, opts, childAsked); }
      var happy = init ? true : this.updateHappy(reason, event, opts, childAsked); if (!init && this.parent && this.parent.update) {
        this.parent.update(reason, event, opts, 'childAsked'); } if (!init && reason === 'onBlur') {
        this.$view.removeMessages(); this.$view.renderMessages(this.$state.get('errors', [])); } return happy; },
    onInit: { validatable: function() { this.validators = this.getO('validators') || this.$view.getValidators();
      var iv = this.getO('initialValue'); if (iv !== undefined) { this.$state.setVal(iv, 'init', 'deep');
        this.$view.renderVal(iv); } else { this.update('init'); } } },
  };


  //////// FORM /////////
  var Form = extendCloneOf(Validatable, { happyType: 'form',
    happy: function(reason, event, opts) { return this.update(reason, event, opts); },
    addEl: function(child, anchor) { HappyElement.prototype.addEl.apply(this, [child, anchor]); this.fields[child.id] = child; this.update('init'); },
    onFocus: function(event) { var input = event.target.HAPPY; if (!input||input.children.length) { return; }
      var field = input.parent, form = field.parent; input.touched = true; field.touched = true; form.currentField = field; }, // console.log('onFocus:', field.id, input.id);
    onBlur: function(event) { var input = event.target.HAPPY; if (!input || input.children.length) { return; }
      var /*field = input.parent, form = field.parent,*/ el = input.el, happy = input.update('onBlur', event); el.classList.toggle('happy', happy);
      if (input.$view.isLabel(el.previousElementSibling)) { el.previousElementSibling.classList.toggle('happy', happy); } }, // console.log('onBlur:', field.id, input.id);
    bindEvents: function() { this.el.addEventListener('focus', this.onFocus, true); this.el.addEventListener('blur', this.onBlur, true); },
    unbindEvents: function() { this.el.removeEventListener('blur', this.onBlur, true); this.el.removeEventListener('focus', this.onFocus, true); },
    opts: { selector: 'form', childSelector: '.field', defaultChildType: 'Field', messagesContext: 'self', msgMountStyle: 'append' },
    onInit: { form: function() { var self = this; this.fields = {};
      this.children.forEach(function(child) { self.fields[child.id] = child; }); this.bindEvents(); } },
  });


  //////// FIELD /////////
  var Field = extendCloneOf(Validatable, { happyType: 'field',
    opts: { childSelector: '.input', defaultChildType: 'Input' },
    onInit: { field: function() { var self = this; this.inputs = {};
      this.children.forEach(function(child) { self.inputs[child.id] = child; }); }
    },
  });


  //////// INPUT /////////
  var Input = extendCloneOf(Validatable, { happyType: 'input', opts: { msgsAnchor: { context: 'parent' } }, });


  ////// REQUIRED VALIDATOR ///////
  var Required = {
    messageFn : function(model) { var label = model.$view.getLabelText(); return (label ? label : model.happyType) + ' is required.'; },
    validateFn: function(model) { var val = model.$state.getVal(); if (val === undefined || (typeof val === 'object' && empty(val))) {
      return { owner: model, text: this.getMessage(model), type: 'error', val }; } },
  };


  extend($happy, { HappyElement, View, State, Validator, Validatable, Form, Field, Input, isArray,
    isExtendable, empty, extend, clone, copy, extendCloneOf, upperFirst, lang });

}(window.$happy));