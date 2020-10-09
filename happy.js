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
  function State(model) { this.model = model; this.data = {}; }
  State.prototype = {
    copy: function(key) { var val = this.get(key); return copy(val); }, // NOTE: doesn't deep-clone arrays!
    get: function(key, defaultVal) { return this.data[key] || defaultVal; },
    set: function(key, val) { return this.data[key] = val; },
    reset: function(key) { return key ? this.data[key] = copy(this.initial[key]) : this.data = copy(this.initial); },
    genVal: function(deep) { var val, children = this.model.children;
      if (children.length === 0) { val = this.get('value', defaultVal); }
      else if (children.length === 1) { val = children[0].$state.getVal(); }
      else { val = {}; children.forEach(function(ch){ val[ch.id] = deep ? ch.$state.genVal() : ch.$state.getVal(); }); }
      //console.log('$state::genVal(), id:', this.model.id, ', deep:', deep, ', val =', val);
      return val; },
    genHappy: function(deep) {},
    genErrors: function(deep) {},
    genModified: function(deep) { var i, modified, children = this.model.children;
     //console.log('$state.genModified(), deep:', deep, ', id:', this.model.id);
     if (children.length === 0) { return ! isSame(this.get('value'), this.get('initVal')); }
     for (i in children) { var ch = children[i], modified = deep ? ch.$state.genModified(deep)
       : ch.$state.get('isModified'); return modified; } },
    getVal: function(defaultVal) { return this.get('value', defaultVal); },
    getHappy: function() { return this.get('isHappy', true); },
    getErrors: function() { return this.get('errors', []); },
    getModified: function() { return this.get('isModified', false); },
    setVal: function(val, init) { if (init) { this.set('initVal', val); }
      //console.log('$state::setVal(), id:', this.model.id, ', val =', val, ', init =', init);
      return this.set('value', init ? copy(val) : val); },
    setHappy: function(val, init) { return this.set('isHappy', val, init); },
    setErrors: function(errors, init) { return this.set('errors', errors || [], init); },
    setModified: function(val, init) { return this.set('isModified', val, init); },
    updateVal: function(deep) { this.setVal(this.genVal(deep)); },
    updateHappy: function(deep) { this.setHappy(this.genHappy(deep)); },
    updateErrors: function(deep) { this.setErrors(this.genErrors(deep)); },
    updateModified: function(deep) { this.setModifieid(this.genModified(deep)); },
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
    parse: function(val) { return val; },
    getVal: function() { var val = {}, model = this.model;
      if (model.children.length > 1) { model.children.forEach(function(child){ val[child.id] = child.$view.getVal(); }); }
      else { val = model.children.length ? model.children[0].$view.getVal() : this.parse(model.el.value); }
      //console.log('$view::getVal(), id:', model.id, ', val =', val);
      return val; },
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
    format: function(val) { return val; },
    setVal: function(val, deep) { var self = this, children = this.model.children; // renderVal()????
        if ( ! children.length) { this.model.el.value = this.format(val?val:''); }
        else if (deep && children.length === 1) { children[0].$view.setVal(this.format(val?val:'')); }
        else if (deep) { children.forEach(function(child) { child.$view.setVal(self.format(val?val[child.id]:'')); }); }
      //console.log('view::setVal(), id:', this.model.id, ', val =', val);
      return val; },
    renderHappy: function(isHappy) { this.model.el.classList.toggle('unhappy', !isHappy); },
    renderModified: function(isModified) { this.model.el.classList.toggle('modified', isModified); },
    renderMessages: function(data) { var mgs = this.model.createMessages(data); mgs.forEach(function(m){ m.mount(); }); },
    remove: function(el) { return this.el.parentElement.removeChild(el); }
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
    //console.log('Construct Happy Element! opts:', opts);
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
     if (this.children.length) { val = this.$state.genVal(); this.$state.setVal(val, 'init'); this.$view.setVal(val); }
     else { this.$state.setVal(this.$view.getVal(), 'init');  }
    } else { this.$state.setVal(this.opts.val, 'init'); this.$view.setVal(this.opts.val, 'deep'); }
    this.triggerEvent('onInit');
  }
  HappyElement.prototype = {
    happyType: 'element',
    getO: function(opts, defaultVal) { return this.opts[opts] || defaultVal; },
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
    reset: function() { var initialVal = this.$state.reset(); this.$view.setVal(initialVal); },
    getMessageTypes: function() { var form = this.getParent('form') || this;
      return { 'error': [this.el, '.errors', 'append'], 'summary': [form.el, '.actions', 'before'] }; },
    createMessages: function(reason, event, msgData, opts) { var self = this;
      msgData.forEach(function(data) { self.messages.push( new Message( data.msg, { anchorSelector: opts.anchorSelector, elContext: self.el }) ); });
      return this.messages; },
    triggerEvent: function(eventName, args) { var r, handlers = this[eventName] || {};
      for (var i in handlers) { var handler = handlers[i];
        if (typeof handler === 'function' && (r = handler.apply(this, args))) { return r; } } },
    addEl: function(self, happyElement) { self.children.push(happyElement); self.childNodes.push(happyElement.el); },
  };


  ////// VALIDATABLE ///////
  var Validatable = { happyType: 'validatable', validators: [], messages: [],
    validate: function(reason, event, opts) { var self = this, results = [];
      this.children.forEach(function(child){ if (child.validate) { results = results.concat(child.validate(reason, event, opts)); } });
      this.validators.forEach(function(validator) { results.push(validator.validate(self, reason, event, opts)); });
      // window.console.log(this.happyType + '::validate(), results =', results);
      results.forEach(function(result, i) { results[i] = self.parseValidateResult(result); });
      this.$state.getHappy(results); return this.$state.set('errors', results);
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
    addEl: function(child) { HappyElement.prototype.addEl(this, child); this.fields[child.id] = child;
      this.$state.setVal(this.$state.genVal(), 'init'); },
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