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

form.addEl(new $happy.HappyElement(form, { as: $happy.StreetAddress, elMount: elQ2, mountStyle: 'before', selector: null, val: streetAddress }));
form.addEl(new $happy.HappyElement(form, { as: $happy.Note, elMount: elQ2, mountStyle: 'after', selector: null, val: 'Hello World!' }));

form.onSubmit = function(elForm, event) {
  var frm = this;
  event.preventDefault();
  console.log('** Form submitted **\nElement:', elForm, '\nEvent:', event, '\nHappyForm:', frm);
  frm.$state.updateVal('onSubmit', event);
  frm.$state.updateModified('onSubmit', event);
  frm.$state.updateHappy('onSubmit', event);
  frm.$view.updateHappy(frm.$state.getHappy());
  frm.$view.updateModified(frm.$state.getModified());
  frm.$view.updateMessages(frm.$state.getMessages());
//   if (frm.parent && this.parent.getHappy) { this.parent.getHappy('childAsked', event, opts); }

}


console.log('form:', form);