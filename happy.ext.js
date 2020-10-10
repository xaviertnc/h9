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

    getValue: function(reason, event, opts) { var val, children = this.children, i, n = children.length;
      for(i = 0; i < n; i++) { var c = children[i], v = c.getValue(reason, event, opts);
        if (v !== undefined) { val = v; break; } };
      //console.log('RadioList.$state::getVal(), id:', this.model.id, ', val =', val);
      return val;
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
    getValue: function(reason, event, opts) {
      var children = this.children, deep = reason !== 'childAsked', val = {
        street: deep ? children[0].getValue(reason, event, opts) : children[0].$state.getVal(children[0].defaultVal),
        suburb: deep ? children[1].getValue(reason, event, opts) : children[1].$state.getVal(children[1].defaultVal),
        city  : deep ? children[2].getValue(reason, event, opts) : children[2].$state.getVal(children[2].defaultVal),
        code  : deep ? children[3].getValue(reason, event, opts) : children[3].$state.getVal(children[3].defaultVal) };
      //console.log('StreetAddr.getValue(), val =', val, ', reason:', reason);
      return val;
    },


    $state: {

      setVal: function(val, init) {
        var children = this.model.children;
        val = val ? val : { street: '', suburb: '', city: '', code: '' };
        if (init) { this.set('initVal', val); val = $happy.copy(val); }
        children[0].$state.setVal(val.street, init);
        children[1].$state.setVal(val.suburb, init);
        children[2].$state.setVal(val.city, init);
        children[3].$state.setVal(val.code, init);
        this.set('value', val);
        return val;
      }

    },


    $view: {

      getVal: function() {
        var children = this.model.children, val = {
          street: this.parse(children[0].$view.getVal()),
          suburb: this.parse(children[1].$view.getVal()),
          city  : this.parse(children[2].$view.getVal()),
          code  : this.parse(children[3].$view.getVal()) };
        //console.log('StreetAddr.$view.getVal(), val =', val);
        return val;
      },

      renderVal: function(val) {
        var children = this.model.children;
        val = val ? val : { street: '', suburb: '', city: '', code: '' };
        children[0].$view.renderVal(this.format(val.street));
        children[1].$view.renderVal(this.format(val.suburb));
        children[2].$view.renderVal(this.format(val.city));
        children[3].$view.renderVal(this.format(val.code));
        //console.log('StreetAddr.$view.renderVal(), val =', val);
        return val; // important!
      },

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
  $happy.Note = $happy.extendCloneOf($happy.Field, {

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
