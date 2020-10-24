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
var form = new $happy.HappyElement(F1, { as: $happy.Form, msgAnchorSelector: '.errors' });

form.addEl(new $happy.HappyElement(form, { as: $happy.StreetAddress, elMountAnchor: elQ2, mountStyle: 'before', selector: null, initialValue: streetAddress }));
form.addEl(new $happy.HappyElement(form, { as: $happy.Note, elMountAnchor: elQ2, mountStyle: 'after', selector: null, initialValue: 'Hello World!' }));

form.onSubmit = function(elForm, event) {
	var form = this, elUnhappyInput;
	form.update('onSubmit', event);
  if (elUnhappyInput = form.$view.getUnhappyInput()) {
  	console.log('onSubmit(), elUnhappyInput =', elUnhappyInput, elUnhappyInput.HAPPY);
	  form.showErrors({ showSummary: true, onlySummary: false });
  	elUnhappyInput.focus();
  }
  event.preventDefault();
};

form.onModified = function(modified) {
	console.log('FORM SAYS: Hey, my status changed! Modified = ', modified ? 'YES' : 'NO');
	// var submitBtn = this.el.querySelector('button[type="submit"]'); submitBtn.disabled = !modified;
};

console.log('form:', form);