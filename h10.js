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


    getO(key, def) {

      return (typeof this.options[key] !== 'undefined') ? this.options[key]
        : (this.root ? ((typeof this.root[key] !== 'undefined') ? this.root[key] : def) : def);

    }


    makeId() {

      const type = this.type || 'elm';
      if ( ! this.root.nextId[type]) { this.root.nextId[type] = 1; }
      let id = type + this.root.nextId[type]++;
      if (this.parent.id) { id = this.parent.id + '_' + id; }
      console.log('HappyItem::makeId(), id =', id);
      return id;

    }


    constructor(parent, options) {

      options = options || {};

      console.log('New Happy Item', options);

      this.id = options.id;
      this.type = options.type; delete options.type;
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


    getLabelText() {

      return;

    }


    getValidators() {

      return [];

    }


    getValue() {

      return;

    }


    updateValue() {

      return;

    }


    updateHappy() {

      return;

    }


    updateModified() {

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

      const value = this.getValue();
      switch(reason) {
      case 'submit': break;

      }
      return event;

    }


    constructor(parent, options) {

      //console.log('New Happy Element');
      super(parent, options);

      this.el = this.getO('el'); delete this.options.el;
      this.id = this.getId() || this.makeId(); delete options.id;

      this.validators = [];
      this.errors = [];

    }

  }



  class HappyField extends HappyElement {


    constructor(parent, options) {

      options = options || {};
      options.type = options.type || 'field';
      super(parent, options);

    }

  }



  class HappyForm extends HappyElement {


    getFields() {

      const happyFields = [];
      const fieldSelector = this.getO('fieldSelector', '.field');
      const fieldElements = this.el.querySelectorAll(fieldSelector);
      fieldElements.forEach(elField => happyFields.push(new HappyField(this, { el: elField})));
      this.fields = happyFields;

    }


    getInitialValues() {

    }


    restoreInitialValues() {

    }


    validate(reason, event) {

      this.fields.forEach(field => field.validate(reason, event));

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

      console.log('HappyForm::onSubmit', event);
      this.validate('submit', event);
      if (this.errors.length) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }

    }


    bindEvents() {

      this.el.addEventListener('keydown', this.onKeyDown, true);
      this.el.addEventListener('submit', this.onSubmit, true);
      this.el.addEventListener('focus', this.onFocus, true);
      this.el.addEventListener('blur', this.onBlur, true);

    }


    constructor(parent, options) {

      options = options || {};
      options.type = options.type || 'form';
      super(parent, options);

      this.getFields();
      this.getValidators();
      this.bindEvents();

    }

  }



  window.Happy = class Happy {

    constructor(options) {

      console.log('New Happy');
      this.id = 'HAPPY';
      this.options = {};
      this.nextId = {};
      this.forms = [];

      if (options) { this.init(options); }

    }


    init(options) {

      options = options || {};
      console.log('Happy::init', options);
      const elContext = options.elContext || document;
      const formSelector = options.formSelector || 'form';
      const formElements = elContext.querySelectorAll(formSelector);

      formElements.forEach(elForm => this.forms.push(new HappyForm(this, { el: elForm })));

    }

  }; // End: Happy Class


}(window));