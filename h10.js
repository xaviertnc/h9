/**
 *
 * HAPPY 10
 *
 * @author: Neels Moller
 * @date: 29 August 2021
 *
 */

(function(window){


  class HappyItem {

    notEqual(a, b) {

      return a !== b;

    }


    getO(key, def) {

      return (typeof this.options[key] !== 'undefined') ? this.options[key]
        : (this.root ? ((typeof this.root.options[key] !== 'undefined')
          ? this.root.options[key] : def) : def);

    }


    makeId() {

      const happyType = this.happyType || 'elm';
      if ( ! this.root.nextId[happyType]) { this.root.nextId[happyType] = 1; }
      let id = happyType + this.root.nextId[happyType]++;
      if (this.parent.id) { id = this.parent.id + '_' + id; }
      // console.log('HappyItem::makeId(), id =', id);
      return id;

    }


    constructor(parent, options) {

      options = options || {};

      // console.log('New Happy Item', parent, options);

      this.id = options.id;
      this.happyType = options.happyType; delete options.happyType;
      this.parent = parent || {};
      this.root = parent.root ? parent.root : this.parent;
      this.options = options;

    }

  }



  class HappyElement extends HappyItem {

    getId() {

      if ( ! this.el.id) { return; }
      let pid = this.parent.id;
      return (pid ? pid + '_' : '') + this.el.id;

    }


    getValue(init) {

      // console.log('HappyElement::getValue(', this.id, ')');
      const val = this.el.value;
      console.log('HappyElement::getValue(', this.id, ') val =', val, ', init =', (init ? 'Y' : 'N'));
      if (init) { this.initialVal = val; }
      return this.value = val;

    }


    getLabelText() { return this.el.getAttribute('data-label'); }


    getValidations() {

      var strTests = this.el.getAttribute('data-validate');
      var arrTests = strTests ? strTests.split('|') : [];
      var validations = this.validations;

      if (this.el.hasAttribute('required') || this.el.classList.contains('required')) {
        validations.push({ test: 'required', args: [] }); }

      arrTests.forEach(strTest => { var arrTest = strTest.split(':');
        //console.log('arrTest', arrTest);
        validations.push({ test: arrTest.shift(), args: arrTest }); });

    }


    updateHappy() {

      return;

    }


    updateModified() {

      return;

    }


    updateParent() {

      return;

    }


    showErrors() {

      return;

    }


    removeErrors() {

      return;

    }


    reset() {

      return;

    }


    init() {

      return;

    }


    validate(reason, event) {

      const o = this, latestValue = o.getValue(), tests = o.getO('validators', []);
      o.modified = o.notEqual(o.value, latestValue); o.errors = [];
      o.validations.forEach(function(vd) { var t = tests[vd.test];
        const strError = t ? t(latestValue, o, vd.args, reason, event) : null;
        if (strError) { o.errors.push(strError); } });
      console.log('HappyElement(', o.id, ')::validate(', reason, '), errors:', o.errors);
      o.happy = o.errors.length === 0;
      o.value = latestValue;
      return o.happy;

    }


    constructor(parent, options) {

      //console.log('New Happy Element');
      super(parent, options);

      this.el = this.getO('el'); delete this.options.el;
      this.id = this.getId() || this.makeId(); delete options.id;

      this.el.HAPPY = this;
      this.validations = [];
      this.errors = [];

    }

  }



  class HappyInput extends HappyElement {

    constructor(parent, options) {

      options = options || {};
      options.happyType = options.happyType || 'input';
      super(parent, options);

      this.getValidations();

      // this.value = this.getValue();
      // this.initialValue = this.value;

    }

  }



  class HappyField extends HappyElement {

    getValue(init) {

      // console.log('HappyField::getValue(', this.id, ')');
      const values = [];
      this.inputs.forEach(input => { values.push(input.getValue(init)); });
      const val = values.length ? values.join('|') : '';
      console.log('HappyField::getValue(', this.id, ') val =', val, ', init =', (init ? 'Y' : 'N'));
      if (init) { this.initialVal = val; }
      return this.value = val;

    }


    getInputs() {

      const happyInputs = [];
      const inputSelector = this.getO('inputSelector', '.input');
      const inputElements = this.el.querySelectorAll(inputSelector);
      inputElements.forEach(elInput => happyInputs.push(new HappyInput(this, { el: elInput})));
      this.inputs = happyInputs;

    }


    constructor(parent, options) {

      options = options || {};
      options.happyType = options.happyType || 'field';
      super(parent, options);

      this.getInputs();
      this.getValidations();

      // this.value = this.getValue('init');
      // this.initialValue = this.value;
    }

  }



  class HappyForm extends HappyElement {

    getValue(init) {

      const values = [];
      // console.log('HappyForm::getValue(', this.id, ')');
      this.fields.forEach(field => { values.push(field.getValue(init)); });
      const val = values.length ? values.join('|') : '';
      console.log('HappyForm::getValue(', this.id, ') val =', val, ', init =', (init ? 'Y' : 'N'));
      if (init) { this.initialVal = val; }
      return this.value = val;

    }


    getFields() {

      const self = this;
      const happyFields = [];
      const fieldSelector = this.getO('fieldSelector', '.field');
      const fieldElements = this.el.querySelectorAll(fieldSelector);

      fieldElements.forEach(function(el) {
        const type = el.getAttribute('data-type');
        // console.log('Field Type =', type);
        // if (type) { console.log('Field Type Class:', window[type]); }
        const HappyClass = (type && window[type]) ? window[type] : HappyField;
        happyFields.push(new HappyClass(self, {el}));
      });

      this.fields = happyFields;

    }


    validate(reason, event) {

      const self = this;
      this.happy = true;
      this.modified = false;
      this.fields.forEach(function(field) {
        field.validate(reason, event);
        if ( ! field.happy) { self.happy = false; }
        if ( field.modified ) { self.modified = true; }
      });

      if (this.happy) { super.validate(reason, event); }

      return this.happy;

    }


    onKeyDown(event) {

      return event;

    }


    onFocus(event) {

      return event;

    }


    onBlur(event) {

      return event;

    }


    onSubmit(event) {

      const form = event.target.HAPPY;
      console.log('HappyForm::onSubmit', event, form);
      form.validate('submit', event);
      // if (form.errors.length) {
      event.stopImmediatePropagation();
      event.preventDefault();
      // }

    }


    bindEvents() {

      this.el.addEventListener('keydown', this.onKeyDown, true);
      this.el.addEventListener('submit', this.onSubmit, true);
      this.el.addEventListener('focus', this.onFocus, true);
      this.el.addEventListener('blur', this.onBlur, true);

    }


    constructor(parent, options) {

      options = options || {};
      options.happyType = options.happyType || 'form';
      super(parent, options);

      this.getFields();
      this.getValidations();

      this.getValue('init');

      this.bindEvents();

    }

  }



  window.Happy = class Happy {

    constructor(options) {

      console.log('New Happy');
      this.id = 'HAPPY';
      this.options = options || {};
      this.nextId = {};
      this.forms = [];

      this.init(options.formSelector, options.elContext);

    }


    init(formSelector, elContext) {

      elContext = elContext || document;
      formSelector = formSelector || 'form';
      console.log('Happy::init', elContext, formSelector);
      const formElements = elContext.querySelectorAll(formSelector);

      formElements.forEach(elForm => this.forms.push(new HappyForm(this, { el: elForm })));

    }

  }; // End: Happy Class



  window.RadioList = class RadioList extends HappyField {

    getValue(init) {

      // console.log('RadioList::getValue(', this.id, ')');
      let val; this.inputs.forEach(function(input) { if (input.el.checked) { val = input.getValue(init); } });
      console.log('RadioList::getValue(', this.id, ') val =', val, ', init =', (init ? 'Y' : 'N'));
      if (init) { this.initialVal = val; }
      return val;

    }

  };



  window.CheckList = class CheckList extends HappyField {

    getValue(init) {

      // console.log('CheckList::getValue(', this.id, ')');
      const vals = [];
      this.inputs.forEach(function(input) { if (input.el.checked) { vals.push(input.getValue(init)); } });
      const val = vals.join('|');
      console.log('CheckList::getValue(', this.id, ') val =', val, ', init =', (init ? 'Y' : 'N'));
      if (init) { this.initialVal = val; }
      return val;

    }

  };


}(window));