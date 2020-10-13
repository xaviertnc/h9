/**
 * Welcome to Happy JS Test
 * C. Moller
 * 25 Sep 2020
 */

/// INIT
window.F1 = window.F1 || {};
console.log('F1:', F1);

window.$happy = window.$happy || {};
console.log('$happy:', $happy);


//// APPLICATION
var elQ2 = document.getElementById('question_2');
var streetAddress = { street: 'My Street', suburb: 'My Suburb', city: 'My City', code: '127' };
var form = new $happy.HappyElement(F1, { as: $happy.Form });

form.addEl(new $happy.HappyElement(form, { as: $happy.StreetAddress, elMount: elQ2, mountStyle: 'before', selector: null, initialValue: streetAddress }));
form.addEl(new $happy.HappyElement(form, { as: $happy.Note, elMount: elQ2, mountStyle: 'after', selector: null, initialValue: 'Hello World!' }));

form.onSubmit = function(elForm, event) { var error, form = this;
  console.log('** Form submitted **\nHappyForm:', form);
  form.update('onSubmit', event);
  if (error = form.getFirstError()) {
  	console.log('Form UNHAPPY!  First Error =', error);
  	var elError = error.owner.el, elInputs, elInput;
  	if (elError.classList.contains('input')) { elInput = elError; }
  	else {
  		elInput = elError.querySelector('.unhappy');
  		if (!elInput) { elInput = elError.querySelector('.input'); }
  	}
  	console.log('elError =', elError, ', elInput = ', elInput);
  	if (elInput) { elInput.focus(); }
  }
  event.preventDefault();
};

form.onModified = function(modified) {
	console.log('FORM SAYS: Hey, my status changed! Modified = ', modified ? 'YES' : 'NO');
	// var submitBtn = this.el.querySelector('button[type="submit"]');
	// submitBtn.disabled = !modified;
};

console.log('form:', form);