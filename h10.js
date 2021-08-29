/**
 *
 * HAPPY 10
 *
 * @author: Neels Moller
 * @date: 29 August 2021
 *
 */

(function(window){


  class HappyField {

    constructor() {}

  };



  class HappyForm {

    constructor() {}

  };



  class Happy {

    getO(key, def) {

      return typeof this.opts[key] !== 'undefined' ? this.opts[key] : def;

    }


    findForms() {

      const happyForms = [];
      const elContext = this.getO('elContext', document);
      const formElements = elContext.querySelectorAll(this.getO('formSelector', 'form'));
      formElements.forEach(elForm => happyForms.push(new HappyForm(elForm)));
      return happyForms();

    }


    init(options) {

      console.log('Happy Init - Start, options:', options);
      this.opts = options;

      console.log('Find Forms');
      this.forms = this.findForms();

      console.log('Init forms');
      this.fields = [];
      this.forms.forEach(form => form.init());

    }


  } // End: Happy Class


}(window));