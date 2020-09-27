Validation
----------

Validate can be called on any "validatable" element.

If the element has parent validatable element(s), the parent(s) have to be notified to update
thier state based on the current state of their direct children and any top-level rules.

Keep the concept of a DOC / MULITPLE FORMS out of this!
If you want multiple forms, add your own high-level logic!



When to VALIDATE?
-----------------
  Field:onExit
  Input::onExit && Field::subValidate && !Input::noValidate
  Form:onSubmit
  Form::onInit

  // Manual call...
  Form.state::update(Form.view)         // Deep update Form.state using Form.view from the bottom up!
  Form::validate('myGoodReason')



When to UPDATE THE MODEL STATE?
-------------------------------
Input::onChange() {
  Input.state::update('onInput', Input.view) // Deep update Input.state using Input.view
}
Form::onSubmit() {
  Form.state::update('onSubmit', Form.view)  // Deep update Form.state using Form.view
  Form::validate('onSubmit')                 // onSubmit == Validate children, childAsked == No child validation!
  Form.view.update('onSubmit', Form.state)   // Update Form VIEW value, modified, happy and messages
}
Element::init(opt) {
  if (isset(opt.val)) {
    Element.state.set('value', opt.val);
    Element.view.setVal(opt.val);
  }
  else
  {
    val = Element.view.getVal();
    Element.state.set('value', val);
  }
}


Multi-value fields... Customize Input::setVal() to parse "val" as Field::val and only use the relevant part of it.
   E.g. val.input1_subval /w val = json_parse('{"input1_subval":"100", ...}')


Element.state::get() { Element::children.forEach(child=>child.state.get('value')) ... }
Element.state::getModified() { Element::children.forEach(child=>child.state.getModified()) ... }
Element.state::updateVal(reason, view) { view ? view.getVal() : Element.state::get('value'); Element.parent.state::updateVal() }
Element.state::updateModified() { Element.state::getModified() + Element.parent::updateModified() }

Element::validate(reason, event) {
  Element.children.forEach(child=>child::validate(reason, event))
  Element.validators.forEach(validator=>validator.validate())
  Element.parent::validate('childAsked')
}

Element.state::update(reason, view) {
  Element.state.updateVal(reason, view);
  Element.state::updateModified();
}

Element.view::updateMessages(reason, messages) {
}

Element.view::update(reason, state) {
  Element.el.value = state.get('value');
  Element.view.updateModified(state.isModified);
  Element.view.updateHappy(state.isHappy);
  messages = Element::createMessages(reason, Element.errors, { scheme: firstError / lastError / allErrors|null });
  Element.view.updateMessages(messages); // Add, Delete or update ... Needs unique ids?...
}



Updating state based on call from child element:

  Re-calulate value, modified, errors and messages based on direct child states, without re-calculating any child states!

  Validate self:
    - Get child errors.
    - Run own validator(s) if present. If in first-error mode, skip own validators if child error(s) already exit.
    - Create messages based on first-error mode and summary mode (i.e. Only ONE error message or ALL. Create summary version(s)? )

  Render state:
  Render messages based on their type, message anchor points, mount styles and message rendering rules.
  Rendering the updated state to DOM



  Need:

  All messages must have a common selector or we need a view::getMessages() to get all the messages for any element.
  An element's errors array contains its own errors as well as errors forwarded by its children or other elements.
  An element's messages array only contains the messages it added itself! No messages added by children or other elements.

  We need a way to give unique id's to messages, so we can detect if they exist and could rather be updated.

  state::init() { init ? state.getSaved() || view.getVal() : model.getModified() }

