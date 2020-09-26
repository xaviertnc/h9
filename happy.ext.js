/**
 * Welcome to Happy JS FIELD DEFS
 * C. Moller
 * 25 Sep 2020
 */

window.F1 = window.F1 || {};

window.$happy = window.$happy || {};

$happy.Ext = $happy.Ext || {};


//// STREET ADDRESS
$happy.Ext.StreetAddress = {

  happyType: 'streetaddress',

  $view: {

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

}; // end: StreetAddress


//// NOTE
$happy.Ext.Note = {

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

}; // end: Note
