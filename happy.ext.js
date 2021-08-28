/**
 * Welcome to Happy JS FIELD DEFS
 * C. Moller
 * 25 Sep 2020
 */

window.F1 = window.F1 || {};

window.$happy = window.$happy || {};


(function(F1, $happy) {


  //// RADIO INPUT ////
  $happy.Radio = $happy.extendCloneOf($happy.Input, {

    happyType: 'radio',

    $view: {
      getVal: function() {
        var elInput = this.model.el, val = elInput.checked ? elInput.value : undefined;
        //console.log('Radio.$view::getVal(), id:', this.model.id, ', val =', val);
        return val; },
      renderVal: function(val) {
        // console.log('Radio.$view::renderVal(), id:', this.model.id, ', val =', val);
        this.model.el.checked = (this.model.el.value == val);
        return val; },
    }

  });


  //// RADIO LIST FIELD ////
  $happy.RadioList = $happy.extendCloneOf($happy.Field, {

    happyType: 'radiolist',

    calcValue: function(/*reason, event, opts*/) { //console.log('RadioList::calcValue() - start, id:', this.id);
      var i, n = this.children.length;
      for (i = 0; i < n; i++) { var c = this.children[i], v = c.$state.getVal(); if (v !== undefined) { break; } }
      //console.log('RadioList::calcValue() - done, val =', v);
      return v;
    },

  });


  //// CHECKBOX INPUT ////
  $happy.Checkbox = $happy.extendCloneOf($happy.Input, {

    happyType: 'checkbox',

    $view: {
      getVal: function() { var elInput = this.model.el, val = elInput.checked ? elInput.value : undefined;
        //console.log('Checkbox.$view::getVal(), id:', this.model.id, ', val =', val);
        return val; },
      renderVal: function(val) { this.model.el.checked = !!val;
        //console.log('Checkbox.$view::renderVal(), id:', this.model.id, ', val =', val);
      },
    }

  });


  //// CHECK LIST FIELD ////
  $happy.CheckList = $happy.extendCloneOf($happy.Field, {

    happyType: 'checklist',

    $view: {
      renderVal: function(val) {
        this.model.children.forEach(function(child) { child.$view.renderVal(val[child.id]); });
        return val; },
    }

  });


  //// STREET ADDRESS FIELD ////
  $happy.StreetAddress = $happy.extendCloneOf($happy.Field, {

    happyType: 'streetaddress',


    reset: function(key) {
      this.model.children.forEach(function(child) { child.$state.reset(key); });
      return key ? this.data[key] = this.initial[key] : this.data = $happy.clone(this.initial);
    },


    // NB: We don't need to re-define getValue, setVal, getVal if we stick to conventions
    // and give children ID's that match the value object's keys!
    // StreetAddress is done differently just to demonstrate what's possible.
    calcValue: function(/*reason, event, opts*/) {
      //console.log('StreetAddress::calcValue() - start, id:', this.id);
      var children = this.children, v = {
        street: children[0].$state.getVal(),
        suburb: children[1].$state.getVal(),
        city  : children[2].$state.getVal(),
        code  : children[3].$state.getVal() };
      //console.log('StreetAddress::calcValue() - done, val =', v);
      return v;
    },


    $state: {

      setVal: function(v, reason) {
        v = v || {}; var c = this.model.children;
        //console.log('StreetAddress::$state.setVal(), id:', this.id, ', val:', v, ', reason:', reason);
        if (reason === 'init') { this.set('initialVal', v); v = $happy.copy(v); }
        c[0].$state.setVal(v.street, reason);
        c[1].$state.setVal(v.suburb, reason);
        c[2].$state.setVal(v.city, reason);
        c[3].$state.setVal(v.code, reason);
        this.set('value', v);
        return v;
      }

    },


    $view: {

      renderVal: function(v) {
        v = v || {}; var c = this.model.children;
        c[0].$view.renderVal(this.format(v.street));
        c[1].$view.renderVal(this.format(v.suburb));
        c[2].$view.renderVal(this.format(v.city));
        c[3].$view.renderVal(this.format(v.code));
        return v; // important!
      },

      make: function() {

        const parts = {};

        const el = document.createElement('fieldset');

        parts.fieldLabel = document.createElement('legend');
        parts.widgetContainer = document.createElement('div');
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
        parts.fieldLabel.innerHTML = this.label || 'Street Address';
        parts.widgetContainer.className = 'input-widget';

        parts.street.className = 'input-container';
        parts.streetLabel.innerHTML = this.streetLabel || 'Street Name';
        parts.streetInput.className = 'input';
        parts.streetInput.setAttribute('required', '');

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
  $happy.Note = $happy.extendCloneOf($happy.Field, {

    happyType: 'note',

    $view: {

      make: function() {

        const parts = {};

        const el = document.createElement('div');

        el.className = 'field';
        el.setAttribute('data-type', 'Note');

        parts.label = document.createElement('label');
        parts.label.innerHTML = 'Note';
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
