// HappyJS v9, By: C. Moller, Date: 24 Sep 2020
window.$happy = window.$happy || {};

(function($happy){

  $happy.lang = {}; $happy.nextIds = [];

  function i18n(msgID, message) { var mt = $happy.lang[msgID]; return mt ? mt : message; }
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
  function init(parent, opts) { opts = opts || {}; if (!opts.as) { opts.as = $happy.Form; }
    var obj = new $happy.HappyElement(parent, opts); return $happy[obj.id] = obj; }


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
    resetValue: function() { this.data.errors = []; this.data.isHappy = true;  this.data.isModified = false;
      this.data.value = copy(this.data.initialVal); console.log('State.resetValue() id:',
        this.model.id, ', data:', this.data); return this.data.value; },
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
    getAnchorEl: function(anchor) { var elCtx = this.getContextEl(anchor);
      return anchor.elMount || View.prototype.findEl(anchor.selector, elCtx, elCtx); },
    getMessages: function(anyOwner) { var m = this.model, selector = '.' + m.getO('msgsClass', 'messages') +
      (!anyOwner ? '.' + m.id : ''); var elMsgsCtx = this.getContextEl(m.getO('msgsAnchor', {})),
      msgs = View.prototype.findElAll(selector, elMsgsCtx); console.log('getMessages(), elMsgsCtx:', elMsgsCtx,
      ', msgsSelector:', selector, ', msgs:', msgs); return msgs; },
    make: function(id, className, tag) { var el = document.createElement(tag || 'div');
      if (id) { el.id = id; } if (className) { el.className = className; } return el; },
    mount: function(anchor, el) { el = el || this.model.el; var elAnchor = this.getAnchorEl(anchor);
      // console.log('mount(), m:', m, ', anchor:', anchor, ', el:', el, ', elAnchor:', elAnchor);
      switch(anchor.placement) { case 'prepend': elAnchor.prepend(el); break;
      case 'before': elAnchor.parentElement.insertBefore(el, elAnchor); break;
      case 'after': elAnchor.parentElement.insertBefore(el, elAnchor.nextSibling); break;
      default: elAnchor.append(el); } return el; },
    renderMessages: function(msgs, anchor) { msgs = msgs || []; if (!msgs.length) { return; }
      var m = this.model, elMsgs = View.prototype.make(nextId('msgs'), m.getO('msgsClass', 'messages') + m.id);
      anchor = anchor || m.getO('msgsAnchor', {}); this.mount(anchor, elMsgs);
      msgs.forEach(function(msg){ var elMsg = View.prototype.make(msg.id || nextId('msg'),
        (msg.className || m.getO('msgClass', 'message')) + (msg.type ? ' ' + msg.type : ''));
      elMsg.innerHTML = msg.text; elMsgs.appendChild(elMsg); }); },
    removeMessages: function(anyOwner) { var msgs = this.getMessages(anyOwner);
      // console.log('removeMessages(), id:', this.model.id, ', msgs:', msgs);
      msgs.forEach(function(el){ View.prototype.remove(el); }); },
    remove: function(el) { return el.parentElement.removeChild(el); }
  };


  ////// HAPPY ELEMENT ///////
  function HappyElement(parent, opts) {
    opts = opts || {};
    this.parent = parent || {};
    if (opts.ord) { this.ord = opts.ord; delete opts.ord; }
    if (opts.prev) { this.prev = opts.prev; } delete opts.prev; //this.prev.next = this;
    this.$view = new View(this); this.$state = new State(this);
    if (opts.as) { extend(this, opts.as, 'deep'); delete opts.as; }
    if (this.trigger('beforeInit', [opts])) { return; }
    this.opts = extend(this.opts || {}, opts); // Allows overriding ext optsions.
    this.el = this.getEl(); this.el.HAPPY = this;
    // console.log('HappyElement::init(), el:', this.el);
    this.id = this.opts.id || this.getId();
    this.children = this.getChildren();
    this.trigger('init');
  }
  HappyElement.prototype = {
    happyType: 'element',
    getO: function(opt, defaultVal) { return this[opt] || this.opts[opt] || defaultVal; },
    getId: function() { var pfx = this.parent.id ? (this.parent.id + '_' + this.happyType) : this.happyType; return this.el.id
      ? ((this.parent.id ? this.parent.id + '_' : '') + this.el.id) : (this.opts.ord ? pfx + this.opts.ord : nextId(pfx) ); },
    getEl: function() { var el = this.getO('el'); if (el) { return el; } var selector = this.getO('selector');
      if (selector) { return this.$view.findEl(selector, this.parent.el || document); } return this.$view.make(); },
    getParent: function(happyType) { var self = this.parent; while (self) {
      if (self.happyType === happyType) { return self; } self = self.parent; } },
    getChildren: function() {
      var children = [], self = this, $view = this.$view, defType = this.getO('defaultChildType'),
        last, childNodes = $view.findElAll(this.getO('childSelector'), this.el);
      childNodes.forEach(function(elChild, i) {
        var child, childType = $view.getType(elChild, defType), opts = { el: elChild, ord: i+1, prev: last };
        if ($happy[childType]) { opts.as = $happy[childType]; }
        else if ($happy[defType]) { opts.as = $happy[defType]; }
        child = new HappyElement(self, opts);
        children.push(child);
        last = child;
      });
      return children;
    },
    sortChildern: function() { this.children.sort(function(a,b) { return (a.ord > b.ord) ? 1 : ((b.ord > a.ord) ? -1 : 0); }); },
    trigger: function(eventName, args) { var r, handlers = this[eventName] || {}; if (args && !args.push) { args = [args]; }
      // console.log('trigger(', eventName, '), args =', args);
      for (var i in handlers) { var h = handlers[i]; if (typeof h === 'function' && (r = h.apply(this, args))) { return r; } } },
    addEl: function(happyElement, mountAnchor) { this.$view.mount(mountAnchor || { elMount: this.el, placement: 'append' }, happyElement.el);
      this.children.push(happyElement); },
    resetValue: function() { if (this.children.length) { this.children.forEach(function(child) { child.resetValue(); }); }
      var initialVal = this.$state.resetValue(); if (this.$view.renderVal) { this.$view.renderVal(initialVal); }
      console.log('HappyElement.resetValue() id:', this.id, ', initialVal:', initialVal, ', children:', this.children); },
  };

  ////// VALIDATABLE ///////
  var Validatable = { ord: 0, appyType: 'validatable',
    $state: {
      setVal: function(val, reason, deep) { var init = (reason === 'init'), children = this.model.children;
        if (init) { this.set('initialVal', val, init); val = copy(val); } if (deep && children.length) {
          if (children.length === 1) { children[0].$state.setVal(val, reason); } else { children.forEach(function(child) {
            child.$state.setVal((typeof val==='object') ? val[child.id] : val, reason, deep); }); }
        } this.set('lastValue', init ? val : this.get('value')); this.set('value', val); return val; },
      setHappy: function(val) { return this.set('isHappy', val); },
      setModified: function(val) { return this.set('isModified', val); },
      getVal: function() { var val = this.get('value'); return val; },
      getHappy: function() { return this.get('isHappy', true); },
      getErrors: function(deep) { var children = this.model.children, errors = [];
        if (deep) { children.forEach(function(c) { errors = errors.concat(c.$state.getErrors(deep)); }); }
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
      firstInput: function() { return this.el.querySelector('.input'); },
      getUnhappyInput: function() { return this.model.el.querySelector('.input.unhappy'); },
      getValidators: function() { return this.model.el.hasAttribute('required') ? [new Validator('required', Required)] : []; },
      renderModified: function(isModified) { console.log('renderModified(), isModified:', isModified, ', id:', this.id);
        var el = this.model.el; el.classList.toggle('modified', isModified);
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
    updateModified: function(reason, event, opts, childAsked) { var modified; //console.log('updateModified() id:', this.id, ', reason:', reason);
      if (this.children.length > 0) { //console.log('updateModified(drilldown) id:', this.id, ', reason:', reason);
        if (!childAsked) { this.children.forEach(function(child){ child.updateModified(reason, event, opts, childAsked); }); }
        modified = this.childrenModified(reason, event, opts); } else { modified = this.calcModified(reason, event, opts);
      } this.$state.setModified(modified); return modified; },
    validate: function(reason, event, opts) { var errors = [], self = this; this.validators.forEach(function(validator) {
      var err = validator.validate(self, reason, event, opts); if (err) { errors.push(err); } }); return errors; },
    childrenHappy: function(/*reason, event, opts*/) { for (var i = 0; i < this.children.length; i++) {
      if (!this.children[i].$state.getHappy()) { return false; } } return true; },
    updateHappy: function(reason, event, opts, childAsked) { var errors = [], happy = true;
      if (this.children.length === 0) { errors = this.validate(reason, event, opts); happy = !errors.length;
        console.log('updateHappy() elmIsInput: true, id:', this.id, ', reason:', reason, ', errors:', errors); }
      else { // console.log('updateHappy(drilldown) id:', this.id, ', reason:', reason);
        if (childAsked) { happy = this.childrenHappy(reason, event, opts); }
        else { this.children.forEach(function(child){ if (child.updateHappy(reason, event, opts, childAsked).length) { happy = false; } }); }
        if (this.validators.length) { errors = this.validate(reason, event, opts); if (errors.length) { happy = false; } }
      } this.$state.setHappy(happy); this.$state.set('errors', errors); return errors; },
    calcValue: function(/*reason, event, opts*/) { if (this.children.length > 1) { var vals = {};
      this.children.forEach(function(c){ vals[c.id] = c.$state.getVal(); }); return vals; } return this.children[0].$state.getVal(); },
    updateValue: function(reason, event, opts) {
      var val = (this.children.length > 0) ? this.calcValue(reason, event, opts) : this.$view.getVal(); this.$state.setVal(val, reason);
      console.log('updateValue(', reason, ')', this.id, ', value =',val);
      return val; },
    update: function(reason, event, opts, childAsked) {  opts = opts || {};
      // console.log('update(), id:', this.id, ', reason:', reason);
      var ret = { happy: true, modified: false, value: this.updateValue(reason, event, opts), errors: [] };
      if (reason !== 'init') { ret.modified = this.updateModified(reason, event, opts, childAsked);
        ret.errors = this.updateHappy(reason, event, opts, childAsked); ret.happy = this.$state.getHappy();
        if (this.parent && this.parent.update) { this.parent.update(reason, event, opts, 'childAsked'); }
      } return (this.onUpdate ? this.onUpdate(ret) : ret); },
    renderMessages: function(msgs, anchor, keepExisting) { if (!keepExisting) { this.$view.removeMessages('anyOwner'); }
      console.log('renderMessages(), msgs:', msgs);
      var self = this; setTimeout(function() { self.$view.renderMessages(msgs, anchor); }); },
    getErrors: function(deep) { return this.$state.getErrors(deep); },
    init: { validatable: function() { this.validators = this.getO('validators') || this.$view.getValidators();
      var iv = this.getO('initialValue'); if (iv !== undefined) { this.$state.setVal(iv, 'init', 'deep');
        this.$view.renderVal(iv); } else { this.update('init'); } } }
  };


  //////// FORM /////////
  var Form = extendCloneOf(Validatable, { happyType: 'form',
    opts: { selector: 'form', childSelector: '.field', defaultChildType: 'Field', msgsContext: 'self', msgsPlacement: 'append' },
    addEl: function(child, anchor, ord) { HappyElement.prototype.addEl.apply(this, [child, anchor, ord]); this.update('init'); },
    onKeyDown: function(event) { var input = event.target.HAPPY;
      console.log('onKeydown(), event:', event, ', input:', input);
      if (input && event.keyCode == 13) {
        console.log('YIPPIE! ENTER!!!');
        event.preventDefault(); event.stopImmediatePropagation();
        var nextField = input.parent.findNext();
        var nextInput = nextField.$view.firstInput();
        nextInput.focus();
      }
    },
    onFocus: function(event) { var input = event.target.HAPPY; if (!input||input.children.length) { return; }
      var field = input.parent, form = field.parent; form.currentField = field; },
    onBlur: function(event) { var input = event.target.HAPPY;
      console.log('onBlur(), ignore = ', $happy.ignoreOnBlur, ', event:', event, ', input:', input);
      if (!input || input.children.length || $happy.ignoreOnBlur) { return; }
      var $view = input.$view, field = input.parent, form = field.parent;
      setTimeout(function(){ console.log('*** RUN DEFERRED onBlur ***');
        if ($happy.cancelOnBlur) { return $happy.cancelOnBlur = false; }
        var r = input.update('onBlur', event);
        $view.renderHappy(r.happy);
        $view.renderModified(r.modified);
        $view.renderMessages(r.errors);
        input.touched = true; field.touched = true; form.touched = true; $happy.ignoreOnBlur = false;
      }, 100); },
    bindEvents: function() {
      this.el.addEventListener('keydown', this.onKeyDown, true);
      this.el.addEventListener('focus', this.onFocus, true);
      this.el.addEventListener('blur', this.onBlur, true);
    },
    isHappy: function() { return this.$state.getHappy(); },
    getFirstUnhappy: function() { return this.$view.firstUnhappyInput(); },
    reset: function(event, opts, autofocus) { $happy.ignoreOnBlur = true; var i0 = this.firstInput();
      this.resetValue(); this.update('reset', event, opts); this.removeMessages('anyOwner');
      if (autofocus && i0) { setTimeout(function() { i0.el.focus(); }, 100); }},
    init: { form: function() { this.bindEvents(); } },
    submit: { before: null, main: function(event) { if (this.currentField) { this.currentField.updateValue('submit', event); }
      console.log('submit::main()', event, ', curField.$sate.getVal() =', this.currentField.$state.getVal());
      event.preventDefault(); event.stopImmediatePropagation();  var form = this, elUnhappy, state = form.update('submit', event);
      if (state.happy) { return true; } form.renderMessages(form.getErrors('deep')); elUnhappy = form.getFirstUnhappy();
      if (elUnhappy) { setTimeout(function() { elUnhappy.focus(); }, 100); } }, after: null }
  });


  //////// FIELD /////////
  var Field = extendCloneOf(Validatable, { happyType: 'field', opts: { childSelector: '.input', defaultChildType: 'Input' }});


  //////// INPUT /////////
  var Input = extendCloneOf(Validatable, { happyType: 'input', opts: { msgsAnchor: { context: 'parent' } }, });


  ////// REQUIRED VALIDATOR ///////
  var Required = {
    messageFn : function(model) { var label = model.$view.getLabelText(); return (label ? label : model.happyType) + ' is required.'; },
    validateFn: function(model) { var val = model.$state.getVal(); if (val === undefined || (typeof val === 'object' && empty(val))) {
      return { owner: model, text: this.getMessage(model), type: 'error', val }; } },
  };


  extend($happy, { HappyElement, View, State, Validator, Validatable, Form, Field, Input, isArray,
    isExtendable, empty, extend, clone, copy, extendCloneOf, upperFirst, i18n, init });

}(window.$happy));