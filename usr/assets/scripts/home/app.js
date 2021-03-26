

class ElementClickCapturer {
  constructor(tagName, className='') {
    this.tagName = tagName;
    this.className = className;
    document.body.addEventListener('click', this._elementCapture.bind(this), false);
  }

  _elementCapture(event) {
    let target = event.target ?? event.srcElement;

    if (target.tagName == this.tagName && target.classList.contains(this.className) ) {
        event.preventDefault();
        this.onElementCaptured(target);
    }
  }

  onElementCaptured(href, element) {
    console.log("Captured element:", element);
  }
}

class TextElementEditor {

  constructor(element) {
    this.element = element;
    this.oldVal = element.innerHTML;
    this._onkeyPress = this._onkeyPress.bind(this);
    element.addEventListener('keypress', this._onkeyPress)
    //element.addEventListener('focusout', () => this._onkeyPress({key:'Enter'}));
    element.setAttribute('contenteditable', true);
  }

  _onkeyPress(event) {
    if (event.key == 'Enter') {
      this.element.setAttribute('contenteditable', false);
      if (this.oldVal != this.element.innerHTML)
        this.onEdited(this.oldVal, this.element.innerHTML, this.element);
    }
  }

  onEdited(oldVal, newVal, element) {
    console.log(`Element edited: oldVal'${oldVal}' newVal'${newVal}'\n`, element);
  }

  destroy() {
    this.element.removeEventListener( 'keypress', this._onkeyPress );
    this.element.removeEventListener( 'focusout', this._onkeyPress );

  }
}

class PropertiesEditor {
   constructor() {
     this.editors = [];
     this.elementClickCapturer = new ElementClickCapturer('SPAN', 'property');
     this.elementClickCapturer.onElementCaptured = this._edit.bind(this);
   }

   _edit(element) {
    this.ed = new TextElementEditor(element);
    this.ed.onEdited = (oldVal, newVal, element) => {
      this.ed.destroy();
      this.onPropertyEdited(oldVal, newVal, element);
    };
  }

  onPropertyEdited(oldVal, newVal, element) {
    console.log(`Property edited: oldVal'${oldVal}' newVal'${newVal}'\n`, element);
  }

}

class UserManagement {
  constructor() {
    this.propetiesEditor = new PropertiesEditor();

  }

}

window.onload = () => new UserManagement();
