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
var streetAddress = { street: 'My Street', suburb: 'My Suburb', city: 'My City' };
var form = new $happy.HappyElement(F1, { as: $happy.Form });

form.addEl(new $happy.HappyElement(form, { as: $happy.StreetAddress, elMount: elQ2, mountStyle: 'before', selector: null, val: streetAddress }));
form.addEl(new $happy.HappyElement(form, { as: $happy.Note, elMount: elQ2, mountStyle: 'after', selector: null, val: 'Hello World!' }));

form.onSubmit = function(elForm, event) {
	console.log('** Form submitted **\nElement:', elForm, '\nEvent:', event, '\nHappyForm:', this);
	event.preventDefault();
	this.$state.update('onSubmit', event); // Update STATE using VIEW (User inputs)
	this.validate     ('onSubmit', event); // Add validation errors if applicable
	this.$view.update ('onSubmit', event, { anchorSelector: '.actions' }); // Render the NEW STATE
}


console.log('form:', form);