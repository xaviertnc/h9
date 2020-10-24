// HappyJS v9, By: C. Moller, Date: 24 Sep 2020
window.$happy = window.$happy || {};

(function($happy){

  $happy.lang = {}; $happy.nextIds = [];

  function t(msgID, message) { var mt = happy.lang[msgID]; return mt ? mt : message; }
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
  };


  //////// HAPPY VIEW ////////
  function View(model) { this.model = model; }
  View.prototype = {
    findEl: function(selector, elContext, elDefault) { elContext = elContext || document;
      return selector ? elContext.querySelector(selector) : elDefault; },
    findElAll: function(selector, elContext) { elContext = elContext || document;
      // console.log('findElAll(), selector:', selector, ', elContext:', elContext, ', id:', this.model ? this.model.id : 'na');
      return selector ? elContext.querySelectorAll(selector) : []; },
    getType: function(el, defaultType) {
      var type = el.getAttribute('data-type'); if (type) { return type; }
      type = el.getAttribute('type'); if (type) { return upperFirst(type); }
      return defaultType; },
    getMessagesContext: function(opts) { opts = opts || {}; var m = this.model; context = opts.messagesContext ||
      m.getO('messagesContext', 'parent'); return (context === 'parent') ? m.el.parentElement : m.el; },
    getMessageAnchor: function(opts) { opts = opts || {}; var m = this.model,
      anchorSelector = opts.anchorSelector || m.getO('msgAnchorSelector'), elContext = this.getMessagesContext(opts);
      //console.log('getMessageAnchor()', anchorSelector, elContext);
      return anchorSelector ? View.prototype.findEl(anchorSelector, elContext) : m.el; },
    getMessages: function(selector, opts) { return View.prototype.findElAll(
      selector || this.model.getO('msgSelector', '.message'), this.getMessagesContext(opts)); },
    make: function(id, className, tag) { var el = document.createElement(tag || 'div');
      if (id) { el.id = id; } if (className) { el.className = className; } return el; },
    mount: function(elAnchor, mountStyle, el) { el = el || this.make();
      elAnchor = elAnchor || document.body; switch(mountStyle) {
      case 'before': elAnchor.parentElement.insertBefore(el, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(el, elAnchor.nextSibling); break;
      default: elAnchor.appendChild(el); } return el; },
    renderMessage: function(msgText, opts) { opts = opts || {}; var m = this.model,
      elMsg = View.prototype.make(opts.id || nextId('msg'), opts.className || m.getO('msgClassName', 'message' +
        (opts.type ? ' ' + opts.type : '')), opts.tag || m.getO('msgTag')); elMsg.innerHTML = msgText;
      View.prototype.mount(opts.elAnchor || this.getMessageAnchor(opts), opts.mountStyle ||
        m.getO('msgMountStyle', 'after'), elMsg); return elMsg; },
    removeMessages: function(selector, opts) { var msgs = this.getMessages(selector, opts);
      msgs.forEach(function(elMsg){ View.prototype.remove(elMsg); }); },
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
    this.id = this.opts.id || this.getId();
    this.childNodes = []; this.children = this.getChildren();
    //console.log('Construct Happy Element! this:', this);
    this.triggerEvent('onInit');
  }
  HappyElement.prototype = {
    happyType: 'element',
    getO: function(opt, defaultVal) { return this[opt] || this.opts[opt] || defaultVal; },
    getId: function() { return this.el.id ? this.el.id : (this.opts.index ? this.happyType+'_'+this.opts.index : nextId(this.happyType)); },
    getEl: function() { var el = this.getO('el'); if (el) { return el; }
      var selector = this.getO('selector'), elContext = this.parent.el || document.body;
      if (selector) { return this.$view.findEl(selector, elContext); }
      return this.$view.mount(this.getO('elMountAnchor', elContext), this.getO('mountStyle'));
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


  ////// VALIDATABLE ///////
  var Validatable = { happyType: 'validatable',
    $state: {
      setVal: function(val, reason, deep) { var children = this.model.children;
        if (reason === 'init') { this.set('initialVal', val); val = copy(val); }
        if (deep && children.length) {
          if (children.length === 1) { children[0].$state.setVal(val, reason); }
          else { children.forEach(function(child) { child.$state.setVal((typeof val==='object') ? val[child.id] : val, reason, deep); }); }
        } this.set('value', val); return val; },
      setHappy: function(val) { return this.set('isHappy', val); },
      setModified: function(val) { return this.set('isModified', val); },
      getVal: function() { var val = this.get('value'); /*console.log('STATE::getVal(), id:', this.model.id, ', val =', val);*/ return val; },
      getHappy: function() { return this.get('isHappy', true); },
      getErrors: function(deep) { var children = this.model.children, errors = [];
        if(deep) { children.forEach(function(c) { errors = errors.concat(c.$state.getErrors(deep)); }); }
        errors = errors.concat(this.get('errors', [])); return errors; },
      getModified: function() { return this.get('isModified', false); }
    },
    $view: {
      format: function(val) { return val; },
      isLabel: function(el) { return el && el.nodeName === 'LABEL'; },
      parse: function(val) { return (val || val === 0) ? val : undefined; },
      getVal: function() { var val = {}, model = this.model; //console.log('$view::getVal() - start, id:', model.id);
        if (model.children.length > 1) { model.children.forEach(function(child){ val[child.id] = child.$view.getVal(); }); }
        else { val = model.children.length ? model.children[0].$view.getVal() : this.parse(model.el.value); }
        //console.log('$view::getVal() - done, val =', val);
        return val; },
      getLabelText: function() {
        var model = this.model, el = model.el, elParent = model.parent ? model.parent.el : el.parentElement, elLabel;
        if (model.happyType === 'input') { elLabel = this.isLabel(el.previousElementSibling) ? el.previousElementSibling
          : (this.isLabel(el.nextElementSibling) ? el.nextElementSibling : elParent.querySelector('label')); }
        else { elLabel = this.isLabel(el.firstElementChild) ? el.firstElementChild : el.querySelector('label'); }
        model.label = elLabel ? elLabel.innerHTML : el.getAttribute('data-label');
        // window.console.log('gelLabel(), label:', model.label, ', elLabel:', elLabel, ', elParent:', elParent, ', el:', el);
        return model.label; },
      getUnhappyInput: function() { return this.model.el.querySelector('.input.unhappy,.field.unhappy input'); },
      getErrorInput: function(error) { var el = error.owner.el; return el.classList.contains('.input') ? el : el.querySelector('.input'); },
      getValidators: function() { return this.model.el.hasAttribute('required') ? [new Validator('required', Required)] : []; },
      renderModified: function(isModified) { var el = this.model.el; el.classList.toggle('modified', isModified);
        if (this.isLabel(el.previousElementSibling)) { el.previousElementSibling.classList.toggle('modified', isModified); } },
      renderHappy: function(isHappy) { var el = this.model.el; el.classList.toggle('unhappy', !isHappy);
        if (this.isLabel(el.previousElementSibling)) { el.previousElementSibling.classList.toggle('unhappy', !isHappy); } },
      renderError: function(error, opts) { opts = opts || {}; var m = this.model;
        opts.elAnchor = opts.elAnchor || m.getO('elErrMsgAnchor'); opts.mountStyle = opts.mountStyle || m.getO('errMsgMountStyle');
        opts.className = opts.className || m.getO('errMsgClassName', 'message error' + (opts.type ? ' ' + opts.type : ''));
        opts.tag = opts.tag || m.getO('errMsgTag'); opts.messagesContext = opts.messagesContext || m.getO('errMsgsContext');
        opts.anchorSelector = opts.anchorSelector || m.getO('errMsgAnchorSelector');
        return this.renderMessage(opts.alt ? error.altMsg : error.msg, opts); },
      renderVal: function(val) { var self = this, children = this.model.children;
        if (!children.length) { this.model.el.value = this.format(val?val:''); }
        else if (children.length === 1) { children[0].$view.renderVal(this.format(val?val:'')); }
        else if (typeof val === 'object') {
          children.forEach(function(child) { child.$view.renderVal(self.format(val?val[child.id]:'')); });
        } return val; },
    },
    calcModified: function(reason, event, opts) { return this.$state.getVal() != this.$state.get('initialVal'); },
    childrenModified: function(reason, event, opts) { /*console.log('childrenModified()');*/ for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].$state.getModified()) { return true; } } return false; },
    updateModified: function(reason, event, opts) { var modified = false, self = this;
      //console.log('updateModified(), reason:', reason, ', this:', this.id);
      var modified = (this.children.length > 0) ? this.childrenModified(reason, event, opts) : this.calcModified(reason, event, opts);
      if (this.$state.getModified() !== modified && (!this.onModified || !this.onModified(modified))) {
        this.$state.setModified(modified); this.$view.renderModified(modified); }
      return modified;
    },
    validate: function(reason, event, opts) { var errors = [], self = this; this.validators.forEach(function(validator) {
      var err = validator.validate(self, reason, event, opts); if (err) { errors.push(err); } }); return errors; },
    childrenHappy: function(reason, event, opts) { //console.log('childrenHappy(), id:', this.id);
      for (var i = 0; i < this.children.length; i++) { if(!this.children[i].$state.getHappy()) { return false; } } return true; },
    updateHappy: function(reason, event, opts, childAsked) { var errors = [], happy = true, self = this;
      //console.log('updateHappy(), reason:', reason, ', childAsked:', childAsked, ', this:', this.id);
      if (this.children.length === 0) { errors = this.validate(reason, event, opts); happy = !errors.length; } else {
        if (childAsked) { happy = this.childrenHappy(reason, event, opts); }
        else { this.children.forEach(function(child){ if (!child.updateHappy(reason, event, opts, childAsked)) { happy = false; } }); }
        if (happy && this.validators.length) { errors = this.validate(reason, event, opts); happy = !errors.length; } }
      if (this.$state.getHappy() !== happy && (!this.onHappy || !this.onHappy(happy, errors))) {
        this.$state.setHappy(happy); this.$view.renderHappy(happy); }
      this.$state.set('errors', errors);
      return happy;
    },
    calcValue: function(reason, event, opts) { var v; // console.log('calcValue() - start, id:', this.id);
      if (this.children.length > 1) { v = {}; this.children.forEach(function(c){ v[c.id] = c.$state.getVal(); }); }
      else { v = this.children[0].$state.getVal(); } /*console.log('calcValue() - done, val =', v);*/ return v; },
    updateValue: function(reason, event, opts) { //console.log('updateValue(), reason:', reason, ', this:', this.id);
      var val = (this.children.length > 0) ? this.calcValue(reason, event, opts) : this.$view.getVal();
      this.$state.setVal(val, reason); return val; },
    update: function(reason, event, opts, childAsked) {
      //console.log('update(), reason:', reason, ', childAsked:', childAsked, ', this:', this.id);
      opts = opts || {}; var val, modified, happy, init = (reason === 'init');
      val = this.updateValue(reason, event, opts);
      modified = init ? false : this.updateModified(reason, event, opts, childAsked);
      happy = init ? true : this.updateHappy(reason, event, opts, childAsked);
      //console.log('update(), modified:', modified, ', happy:', happy, ', errors:', this.$state.getErrors());
      if (!init && this.parent && this.parent.update) { this.parent.update(reason, event, opts, 'childAsked'); }
      return happy;
    },
    removeErrors: function(selector, opts) { this.$view.removeMessages(selector || this.getO('errMsgSelector', '.message.error'), opts); },
    showErrors: function(opts) { opts = opts || {}; var self = this, errors; this.removeErrors(opts.selector, opts);
      errors = opts.errors || this.$state.getErrors('deep'); errors.forEach(function(error) {
        if (!opts.onlySummary) { opts.alt = false; error.owner.$view.renderError(error, opts); }
        if (opts.showSummary) { opts.alt = true; self.$view.renderError(error, opts); } }); },
    onInit: { validatable: function() { this.$state.set('messages', []);
      this.validators = this.getO('validators') || this.$view.getValidators(); var iv = this.getO('initialValue');
      if (iv !== undefined) { this.$state.setVal(iv, 'init', 'deep'); this.$view.renderVal(iv); } else { this.update('init'); } }
    },
  };


  //////// FORM /////////
  var Form = extendCloneOf(Validatable, { happyType: 'form', messagesContext: 'self', msgMountStyle: 'append',
    addEl: function(child) { HappyElement.prototype.addEl(this, child); this.fields[child.id] = child; this.update('init'); },
    onFocus: function(event) { var input = event.target.HAPPY; if (!input||input.children.length) { return; }
      var field = input.parent, form = field.parent; input.touched = true; field.touched = true; form.currentField = field; }, // console.log('onFocus:', field.id, input.id);
    onBlur: function(event) { var input = event.target.HAPPY; if (!input||input.children.length) { return; }
      var field = input.parent, form = field.parent; rateLimit(input, input.update, ['onBlurInput', event], 200); }, // console.log('onBlur:', field.id, input.id);
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
      var msg = this.getMessage(model); return { owner: model, msg, altMsg: this.getAltMessage(model) || (msg + ' (alt)'), val }; } },
    messageFn : function(model) { var label = model.$view.getLabelText(); return (label ? label : model.happyType) + ' is required.'; }
  };


  extend($happy, { HappyElement, Validator, Validatable, Form, Field, Input, isExtendable,
    isArray, empty, extend, clone, copy, extendCloneOf, rateLimit, upperFirst, t });

}(window.$happy));