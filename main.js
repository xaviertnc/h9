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


//// EXTEND HAPPY
$happy.Note = $happy.extend($happy.Field, $happy.Ext.Note);
$happy.StreetAddress = $happy.extend($happy.Field, $happy.Ext.StreetAddress);


//// APPLICATION
var elQ2 = document.getElementById('question_2');
var streetAddress = { street: 'My Street', suburb: 'My Suburb', city: 'My City' };
var form = new $happy.HappyElement(F1, { as: $happy.Form });

form.addEl(new $happy.HappyElement(form, { as: $happy.StreetAddress, elMount: elQ2, mountStyle: 'before', selector: null, val: streetAddress }));
form.addEl(new $happy.HappyElement(form, { as: $happy.Note, elMount: elQ2, mountStyle: 'after', selector: null, val: 'Hello World!' }));

form.onSubmit = function(elForm, event) { console.log('Form submitted.', this); event.preventDefault(); }


console.log('form:', form);