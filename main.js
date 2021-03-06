/* globals F1, $happy */

/**
 * Welcome to Happy JS Test
 * C. Moller
 * 25 Sep 2020
 */

/// INIT
window.F1 = window.F1 || {};
// console.log('F1:', F1);

window.$happy = window.$happy || {};
// console.log('$happy:', $happy);

const happyForm = $happy.init(F1);

//// APPLICATION
// var topMsgsAnchor = { id: 'top', context: 'self', selector: '.top', placement: 'after' };
// var bottomMsgsAnchor = { id: 'bottom', context: 'self', selector: '.bottom', placement: 'after' };
// var form = new $happy.HappyElement(F1, { as: $happy.Form });

// form.onSubmit = function(event) { var form = this;
//   if ( ! form.happy('onSubmit', event)) {
//     var elUnhappyInput = form.$view.getUnhappyInput();
//     console.log('onSubmit(), elUnhappyInput =', elUnhappyInput, elUnhappyInput.HAPPY);
//     var errors = form.$state.getErrors('deep');
//     console.log('onSubmit(), messages =', errors);
//     form.$view.removeMessages();
//     form.$view.renderMessages(errors, topMsgsAnchor);
//     form.$view.renderMessages(errors, bottomMsgsAnchor);
//     elUnhappyInput.focus();
//   }
//   event.preventDefault();
// };

// form.onModified = function(modified) {
//   console.log('FORM SAYS: Hey, my status changed! Modified = ', modified ? 'YES' : 'NO');
// };

var strAddrInitVal = { street: 'My Street', suburb: 'My Suburb', city: 'My City', code: '127' };
var strAddrField = new $happy.HappyElement(happyForm, { as: $happy.StreetAddress, initialValue: strAddrInitVal });
var noteField = new $happy.HappyElement(happyForm, { as: $happy.Note, initialValue: 'Hello World!' });

happyForm.addEl(strAddrField, { selector: '#question_2', placement: 'before' });
happyForm.addEl(noteField, { selector: '#question_2', placement: 'after' });

// console.log('happyForm:', happyForm);