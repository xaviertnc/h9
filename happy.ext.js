/**
 * Welcome to Happy JS FIELD DEFS
 * C. Moller
 * 25 Sep 2020
 */

window.F1 = window.F1 || {};

window.$happy = window.$happy || {};


(function(F1, $happy) {


  //// RADIO INPUT ////
  $happy.Radio = $happy.extendPlugin($happy.Input, {

    happyType: 'radio',

    $view: {
      setVal: function(val) { console.log('Radio.$view::setVal(), id:', this.model.id, ', val =', val); this.model.el.checked = (this.model.el.value == val); return val; },
      getVal: function() { var elInput = this.model.el, val = elInput.checked ? elInput.value : undefined;
        console.log('Radio.$view::getVal(), id:', this.model.id, ', val =', val); return val; }
    }

  });


  //// RADIO LIST FIELD ////
  $happy.RadioList = $happy.extendPlugin($happy.Field, {

    happyType: 'radiolist',

    $state: {
      genVal: function(/*deep*/) { var val = undefined, children = this.model.children;
        children.forEach(function(child){ var v = child.$state.getVal(); if (v !== undefined) { val = v; return false; } }); 
        console.log('RadioList.$state::getVal(), id:', this.model.id, ', val =', val);
        return val; },
    }

  });


  //// CHECKBOX INPUT ////
  $happy.Checkbox = $happy.extendPlugin($happy.Input, {

    happyType: 'checkbox',

    $view: {
      setVal: function(val) { console.log('Checkbox.$view::setVal(), id:', this.model.id, ', val =', val); this.model.el.checked = !!val; },
      getVal: function() { var elInput = this.model.el, val = elInput.checked ? elInput.value : undefined;
        console.log('Checkbox.$view::getVal(), id:', this.model.id, ', val =', val); return val; }
    }

  });


  //// CHECK LIST FIELD ////
  $happy.CheckList = $happy.extendPlugin($happy.Field, {

    happyType: 'checklist',

    $view: {
      setVal: function(val) { this.model.children.forEach(function(child) { child.$view.setVal(val[child.id]); }); return val; },
    }

  });


  //// STREET ADDRESS FIELD ////
  $happy.StreetAddress = $happy.extendPlugin($happy.Field, {

    happyType: 'streetaddress',


    reset: function(key) {
      this.model.children.forEach(function(child) { child.$state.reset(key); });
      return key ? this.data[key] = this.initial[key] : this.data = $happy.clone(this.initial);
    },


    $view: {

      setVal: function(val) {
        var children = this.model.children;
        console.log('StreetAddr.$view.setVal(), val =', val);
        val = val ? val : { street: '', suburb: '', city: '', code: '' };
        children[0].$view.setVal(val.street);
        children[1].$view.setVal(val.suburb);
        children[2].$view.setVal(val.city);
        children[3].$view.setVal(val.code);
        return val; // important!
      },

//       getVal: function(reason, event, opts) {
//         var children = this.model.children, val = {};
//         if (reason !== 'childAsked') {
//           children[0].$state.set('value', children[0].$view.getVal('parentAsked', event, opts));
//           children[1].$state.set('value', children[1].$view.getVal('parentAsked', event, opts));
//           children[2].$state.set('value', children[2].$view.getVal('parentAsked', event, opts));
//           children[3].$state.set('value', children[3].$view.getVal('parentAsked', event, opts));
//         }
//         val.street = children[0].$state.get('value');
//         val.suburb = children[1].$state.get('value');
//         val.city   = children[2].$state.get('value');
//         val.code   = children[3].$state.get('value');
//         return val;
//       },

      make: function() {

        const parts = {};

        const el = document.createElement('div');

        parts.fieldLabel = document.createElement('label');
        parts.widgetContainer = document.createElement('fieldset');
        parts.street      = document.createElement('div');
        parts.streetLabel = document.createElement('label');
        parts.streetInput = document.createElement('input');
        parts.suburb      = document.createElement('div');
        parts.suburbLabel = document.createElement('label');
        parts.suburbInput = document.createElement('input');
        parts.city        = document.createElement('div');
        parts.cityLabel   = document.createElement('label');
        parts.cityInput   = document.createElement('input');
        parts.pcode       = document.createElement('div');
        parts.pcodeLabel  = document.createElement('label');
        parts.pcodeInput  = document.createElement('input');

        el.className = 'field';
        el.setAttribute('data-type', 'StreetAddress');
        parts.fieldLabel.innerHTML = this.label || 'I\'m an ADDRESS';
        parts.widgetContainer.className = 'input-widget';

        parts.street.className = 'input-container';
        parts.streetLabel.innerHTML = this.streetLabel || 'Street Name';
        parts.streetInput.className = 'input';

        parts.street.appendChild(parts.streetLabel);
        parts.street.appendChild(parts.streetInput);

        parts.suburb.className = 'input-container';
        parts.suburbLabel.innerHTML = this.suburbLabel || 'Suburb';
        parts.suburbInput.className = 'input';

        parts.suburb.appendChild(parts.suburbLabel);
        parts.suburb.appendChild(parts.suburbInput);

        parts.city.className = 'input-container';
        parts.cityLabel.innerHTML = this.cityLabel || 'City';
        parts.cityInput.className = 'input';

        parts.city.appendChild(parts.cityLabel);
        parts.city.appendChild(parts.cityInput);

        parts.pcode.className = 'input-container';
        parts.pcode.setAttribute('data-type', 'PostalCode');
        parts.pcodeLabel.innerHTML = this.pcodeLabel || 'Code';
        parts.pcodeInput.className = 'input';
        parts.pcodeInput.type = 'number';

        parts.pcode.appendChild(parts.pcodeLabel);
        parts.pcode.appendChild(parts.pcodeInput);

        parts.widgetContainer.appendChild(parts.street);
        parts.widgetContainer.appendChild(parts.suburb);
        parts.widgetContainer.appendChild(parts.city);
        parts.widgetContainer.appendChild(parts.pcode);

        el.appendChild(parts.fieldLabel);
        el.appendChild(parts.widgetContainer);

        if (this.onMake) { this.onMake(el, parts); }

        return el;

      }, // end: view.make

    }, // end view

  }); // end: StreetAddress


  //// NOTE FIELD ////
  $happy.Note = $happy.extendPlugin($happy.Field, {

    happyType: 'note',

    $view: {

      make: function() {

        const parts = {};

        const el = document.createElement('div');

        el.className = 'field';
        el.setAttribute('data-type', 'Note');

        parts.label = document.createElement('label');
        parts.label.innerHTML = 'I\'m a NOTE';
        parts.label.style.display='block';

        parts.input = document.createElement('textarea');
        parts.input.className = 'input';

        el.appendChild(parts.label);
        el.appendChild(parts.input);

        if (this.onMake) { this.onMake(el, parts); }

        return el;

      }, // end: view.make

    }, // end view

  }); // end: Note


}(window.F1, window.$happy));
