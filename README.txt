Happy JS Documentation v1.0
===========================

By: C. Moller - 16 May 2021


Quick Start
-----------

  #HTML
  - Include happy.js
  - Include happy.ext.js if required. (Extra Happy Element Types and Validators)
  - Include happy.env.js if required. (Environment specific $happy customizations)

  - Configure your target <form> tag with id, pjax class and onsubmit handler.  E.g.
    <form id="myform" class="pjax" onsubmit="$happy.myForm.triggerEvent('onSubmit', event)" method="post" novalidate>

  * Notice how the <form> tag-id also becomes a $happy property. It gets added when we run $happy.init()
    to enable global access to your happy form instance.


  #JS
  - Add the following to your main JS script:

    $happy.init();
    - OR -
    $happy.init( NamespaceObject );
    - OR -
    $happy.init(nsObj, options);

      e.g. $happy.init(F1, { selector: '#myform', messagesContext: 'self', msgsPlacement: 'after' });



Happy Init()
------------

/**
 * $happy.init(parent, options)
 *
 * Create a new HappyElement instance based on the provided options.
 *
 * @param {object} parent   E.g. window.F1. Defaults to {}.
 * @param {object} options  See defaults below.
 */

options (default) =
{
  as               : $happy.Form,  // {happy object type prototype} $happy.Form, $happy.MyCustomFormType
  selector         : 'form',       // {string} 'form', '#my-form', '.main-form'
  childSelector    : '.field',     // {string} '.field', '.form-field'
  defaultChildType : 'Field',      // {string} 'Field', 'MyCustomFieldType'
  msgsPlacement    : 'append'      // {string} 'append', 'prepend', 'before', 'after',
  msgsAnchor       : undefined     // {anchor object},
  msgsClass        : '.messages'   // {string},
  msgClass         : '.message'    // {string},
  validClass       : '.happy'      // {string},
  invalidClass     : '.unhappy'    // {string},
  modifiedClass    : '.modified'   // {string},
  validators       : undefined     // {array of validator objects},
  initialValue     : undefined     // {object}
  ... more ...
}

Running init() with no params will auto detect the first available <form> tag
as per the default settings above or fail.

init() will add the resulting $happy.Form instance to $happy as a new property using the
happy form ID as property name.

If you have more than one <form> tag, make sure you give each <form> tag an id attribute and
that you override the default 'selector' option on init. E.g.

$happy.init(F1, { selector: '#main-form' });



How to Access HAPPY Objects
---------------------------

 1) Every happyElement.el gets assigned a HAPPY prop, where HAPPY == happyElement

   e.g. var unhappyInput = elUnhappyInput.HAPPY


 2) The global $happy object contains the initial happy object (The one we ran $happy.init on)

   e.g. $happy.init(F1, { selector: '#myForm'}) SETS $happy.myForm = myHappyFormInstance

 3) Access happy elements via their parent's children, fields or inputs property.

   e.g. var happyField = happyForm.children[0]
   e.g. var happyField = happyForm.fields.{fieldId}
   e.g. var happyField = happyForm.fields.myForm_field1 (auto generated id)
   e.g. var happyInput = happyField.inputs.firstname (id from DOM element id or init option)
   e.g. var happyInput = happyField.inputs.myForm_field1_input1 (auto generated id)



Happy Events
------------

To add an event handler:

  happyObj.{MyEventName} = {
    h1: function(args){...},
    h2: function(args){...},
    ...
  }

  e.g. $happy.myForm.init = {
	      'handler1' : function(args){...},
	      'handler2' : function(args){...},
	      ...
       }

To trigger an event:

  happyObj.trigger(eventName, args);

  e.g. $happy.myForm.trigger('init', event);
  e.g. $happy.myForm.trigger('init', [ event, arg2, arg3, ... ]);

  e.g. $happy.myForm.trigger('submit');
  e.g. $happy.myForm.trigger('submit', event);



Validate
--------

var isHappy = $happy.myForm.happy('onSubmit', event);



Error Mesages
-------------

var validationErrors = $happy.myForm.getErrors('deep');



Validation Error
----------------
var error = {
  owner: model,                           // model == HappyItem Instance. Use to get model.el etc...
  text: validator.getMessage(model),      // Message text. Format and translate in getMessage()
  val: model.$state.getVal(),             // Keep a snapshot of the value at the time of validation.
  type: 'error'                           // Just to allow space for different kinds of errors?
}



Happy Hooks:
------------
beforeInit(opts)
onUpdate(resultObj) // resultObj = { happy, modified, value, errors }, this = self


Message Anchors
---------------

var anchorTop = { id: 'top', context: 'self', selector: '.summary-top'   , placement: 'append' };
var anchorBtm = { id: 'btm', context: 'self', selector: '.summary-bottom', placement: 'append' };

$happy.myForm.removeMessages();
$happy.myForm.renderMessages(validationErrors, anchorTop);
$happy.myForm.renderMessages(validationErrors, anchorBtm);



Anchor Object
-------------

{
  id         : {string} Unique identifier

  elMount    : {HTMLElement}

  context    : {string} 'self', 'parent' (Only search for messages within this element)
  -OR-
  elContext  : {HTMLElement}

  selector   : {string} CSS Selector,
  placement  : {string} 'append', 'prepend', 'before' or 'after'
}



Anchor Element Detection
------------------------

 1) if (anchor.elMount) USE elMount
 2) if (anchor.elContext) USE elContext.find(selector) || elContext
 3) if (anchor.context == 'parent') SET elContext = model.el.parentElement; Goto step 2.
 4) if (anchor.context == 'self' or [anything else]) SET elContext = model.el; Goto step 2.
 5) if ( ! anchor.context ) SET elContext = model.el; Goto step 2.



Mounting Happy Elements
-----------------------

/**
 * happyElement.$view.mount(anchor, el)
 *
 * Insert args.el or happyElement.el into the DOM.
 * Use args.anchor to define where and how to insert.
 *
 * @param  {object}      anchor  Where and how to mount. See Anchor Object notes above.
 * @param  {DOMElement}  el      The DOM element to mount. Defaults to model.el if not set.
 *
 * @return {DOMElement}          The mounted DOM element.
 */

1) Get elToMount = args.el || this.model.el;
2) Get elAnchor = this.getAnchorEl(args.anchor);
3) Insert elToMount into the DOM relative to elAnchor using args.anchor.placement
4) return elToMount



Customizing Happy
-----------------