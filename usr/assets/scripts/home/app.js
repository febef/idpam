/* utilities */
class API {
  constructor(uri) {
    this.uri = uri;
  }

  async doRequest(verb, target, oldVal, newVal) {
    const body = { verb, target };
    if (oldVal) body.oldVal = oldVal;
    if (newVal) body.newVal =  newVal;
    let response = await fetch(this.uri, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type' : 'application/json' }
    } );
    return await response.json();
  }
  async loadClass(className) {
    const response = {success: false}
    try{
      const numeral='%23'
      const imported = await import (
        `/lapi/execute/${numeral}getFrontEndClass/${className}/file`
      );
      response.Class = imported.default;
      response.success = true;
    } catch(e){
      console.log(e);
    }
    return response;
  }
}

class Notifications {

  constructor() {
    this.notifications = [];

    this.enotifications = document.createElement("DIV");
    this.enotifications.classList.add("Notifications");
    document.body.appendChild(this.enotifications);

  }

  newNotify(primitiveNotify) {
    const notify = new Notify(primitiveNotify, this.notifications.length);

    this.enotifications.appendChild(notify.element);
    this.notifications.push(notify);

    notify.onEnded = self => {
      this.enotifications.removeChild(
        this.notifications[self.index].element
      );
      delete this.notifications[self.index];
    };
  }

}

class Notify {
  constructor({title="", message="",time="3000"}, index) {
    this.title = title;
    this.message = message;
    this.time = time;
    this.index = index;
    this._setConntent();
    this._start()
  }

  _setConntent() {
    this.element = document.createElement("DIV");
    this.etimeIcon = document.createElement("SPAN");
    this.etitle = document.createElement("H4");
    this.emenssage = document.createElement("P");

    this.element.id = `notify-${this.index}`;
    this.element.style.display = 'none';

    this.element.classList.add("Notify","box");
    this.etitle.classList.add("title", "boxTitle");
    this.emenssage.classList.add("min-text");

    this.etitle.innerHTML = this.title;
    this.emenssage.innerHTML = this.message;

    this.element.appendChild(this.etitle);
    //this.element.appendChild(this.timeIcon);
    this.element.appendChild(this.emenssage);
  }

  _start() {
    this.element.style.display = 'block';
    this.timerid = setTimeout(this._onEnd.bind(this), this.time);
  }

  _onEnd() {
    this.element.style.display = 'none';
    this.onEnded(this);
  }

  onEnded(self) {

  }
}

class Dialog {
  constructor({properties, title='dialog'}) {
    this.properties = properties;
    this.title = title;
    this._createDialog();
  }

  _createDialog() {
    this.dialog = document.createElement("div");
    this.dialog.classList.add("dialog")
    let doom =`<h3 class='boxTitle'>${this.title}</h3>`
    doom+='<form href="#"><article class="box">';

    for(let p in this.properties)
      doom+=this._renderProperties(this.properties[p], p);

    doom+=`<fieldset>
      <input class="btn" type='submit' value='create'>
    </fieldset>`;  

    doom+='</article></form>';
        
    this.dialog.innerHTML = doom;
    document.body.appendChild(this.dialog);
  }

  _renderProperties(v, k) {
    return `
      <fieldset>
        <label class="min-info">${k}:</label><input type="${v.type}">
        <br>
      </fieldset>
    `;
  }
}

/* end utilities */

/* editor */
class ElementClickCapturer {
  constructor({tagName, className=''}) {
    this.tagName = tagName;
    this.className = className;
    this.event = null;
    document.body.addEventListener(
      'click', this._elementCapture.bind(this), false
    );
  }

  _elementCapture(event) {
    this.event = event;
    let target = event.target ?? event.srcElement;

    if (
      target.tagName == this.tagName &&
      (this.className=='' || target.classList.contains(this.className))
     ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.onElementCaptured(target);
    }
  }

  onElementCaptured(element) {
    console.log("Captured element:", element);
  }
}

class TextElementEditor {

  constructor(element) {
    this.element = element;
    this.oldVal = element.innerHTML;
    this._onkeyPress = this._onkeyPress.bind(this);
    element.addEventListener('keypress', this._onkeyPress)
    element.setAttribute('contenteditable', true);
    this.rollbackValue = this.element.innerHTML;
  }

  _onkeyPress(event) {
    if (event.key == 'Enter') {
      if (event.preventDefault) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      this.element.setAttribute('contenteditable', false);

      if (this.oldVal != this.element.innerHTML) {
        this.onEdited(this.oldVal, this.element.innerHTML, this.element);
        this.oldVal = this.element.innerHTML;
      } else {
        this.onCancel();
      }
      this._destroy();
    }
  }

  async onCancel(){

  };

  async onEdited(oldVal, newVal, element) {
    console.log(
      `Element edited: oldVal'${oldVal}' newVal'${newVal}'\n`,
      element
    );
  }

  rollback() {
    this.element.innerHTML = this.rollbackValue;
  }

  _destroy() {
    this.element.removeEventListener( 'keypress', this._onkeyPress );
    delete this.oldVal;
    this.destroy();
    delete this;
  }

  destroy() {};
}

class SelectMenu {
  static sm=null;
  constructor (element, options=null){

    if (this.sm != null) return this;
    this.main = document.body;
    this.target = element;
    this.idMenu ='selectMenu'
    this.options = options;
    this._createMenu();
    this.sm = this;
  }

  _createMenu() {
    const eMenu = document.querySelector(`#${this.idMenu}`)
    this.menu = eMenu?? document.createElement("div");
    this.menu.id = this.idMenu;
    this.main.appendChild(this.menu);
    this._setStyle(this.menu.style, this.target.getBoundingClientRect());
    this.menu.innerHTML = "";
    this._setContent();
    this._show();

    this.main.onresize = ()=>{
      this._setStyle(this.menu.style, this.target.getBoundingClientRect());
      this._show();
    };
  }

  _setContent(){
    if(!this.options) {
      this.input = document.createElement('INPUT')
      this.input.type="text"
      this.btnOk = document.createElement('BUTTON')
      this.btnOk.innerText = 'ok'

      this.onOk = () => {
        if (this.input.value.trim() != "")
        this.onSetValue(this.input.value);
      };

      this.input.addEventListener('keypress', (event)=>{
        if(event.key == 'Enter')
         this.onOk();
      });
      this.btnOk.onclick = this.onOk.bind(this);

      this.menu.appendChild(this.btnOk);
      this.menu.appendChild(this.input);

    } else {
      this.select = document.createElement('SELECT')

      let eOption = document.createElement('OPTION');
      eOption.innerText = '----';
      eOption.value = 'default';
      this.select.appendChild(eOption);

      for (let option of this.options) {
        eOption = document.createElement('OPTION');
        eOption.innerText = option.text;
        eOption.value = option.value;
        this.select.appendChild(eOption);
      }

      this.select.onchange = () => {
        if (this.select.value!='default') {
          this.onSetValue(
            this.select.value,
            this.select.options[this.select.selectedIndex].text
          );
        }
      };

      this.menu.appendChild(this.select)
    }

    this.btnCancel = document.createElement('BUTTON')
    this.btnCancel.innerText = 'x'
    this.btnCancel.onclick = this.destroy.bind(this);
    this.menu.appendChild(this.btnCancel);

  }

  onSetValue(value){
    console.log(value);
  }

  _setStyle(menu, target) {
    menu.position = 'absolute';
    menu.zIndex = 1000;
    menu.maxHeight= 500+'px';
    menu.top = target.top + target.height+ 'px';

    let offsetLeft = (
     (this.main.offsetWidth < (target.left + this.menu.offsetWidth)) 
      ? -this.menu.offsetWidth+target.width
      : 0
    );
    menu.left = (target.left + offsetLeft ) + 'px';
    menu.display = 'none';
    this.menu.classList.add('box','modal');
  }

  _show() {
    this.menu.style.display = 'block';
  }

  destroy() {
    this.menu.parentElement.removeChild(this.menu);
    delete this;
  }

}

class PropertiesEditor {
  constructor(notifier) {
    this.notifier = notifier;
    this.api = new API('/lapi');
    this.spanPropertyClickCapturer = new ElementClickCapturer({
      tagName:'SPAN', className:'verb'
    });
    this.buttonPropertyClickCapturer = new ElementClickCapturer({
      tagName: 'BUTTON'
    });
    this.spanPropertyClickCapturer
        .onElementCaptured = this._onClick.bind(this);
    this.buttonPropertyClickCapturer
        .onElementCaptured = this._onClick.bind(this);
    this.inprogress = {};
    this.authtypes = {};
    this.dialogs = {};
  }

  _onClick(element) {
    const verb = element.dataset.verb;
    switch(verb) {
      case 'edit'  : this._edit(element)  ; break;
      case 'append': this._append(element); break;
      case 'delete': this._delete(element); break;
      case 'create': this._create(element); break;
    }
  }

  _getType(element) {
    return this._getParentData('type', element)[0];
  }

  _getTarget(element) {
    let pelement = element;
    let target = '', parent;
    do {
      [parent, pelement] = this._getParentData('target', pelement);
      target = parent + (
        (parent) ? ((parent.indexOf(':')>0) ? '/' : '.') : ''
      ) + target;
    } while (target.indexOf(':')<0)

    return target.slice(0,-1);
  }

  _getParentData(key, element){
    let data, dated = element;
    do {
      data = dated.dataset[key];
      dated = dated.parentNode;
      if(dated.tagName=="HTML") return null;
    } while (!data)
    return [data, dated];
  }

  _getTargetParent(target){
    return target.slice(0,
      target.length - 1 - target.split('').reverse().join().indexOf('.')
    );
  }

  async _delete(element){
    const property = element.nextSibling;
    const button = element;
    const item = element.parentNode;

    property.classList.add('property-deleted');
    
    const result = await this.api.doRequest(
      'delete', this._getTarget(property)
    );
    item.dataset.target = item.dataset.target + "~";
    
    if (result.success) {
      const array = property.parentNode.parentNode;
      const item = property.parentNode;
      item.removeChild(button);
      array.removeChild(item);
      if ( result.arraylength == 0 )
        array.innerHTML = '<span class="voidItem">ø</span>';
    } else {
      property.classList.remove('property-deleted');
      item.dataset.target = item.dataset.target.slice(0,-1);
    }

    this.notifier.newNotify({
      title: 'delete',
      message: `success: ${result.success}`
    });
  }

  async _append(element) {
    let options = null;

    if (element.dataset.ref) {
      const response = await this.api.doRequest(
        'read', "#getListOfDocs", null, element.dataset.ref.slice(0,-1)
      );
      if (!response.success) return;
      options = response.value.map (model => ({
        text:model.name, value: model._id
      }));
    }

    this.selectMenu = new SelectMenu(element, options);
    this.selectMenu.onSetValue = async (value) => {

      this.selectMenu.destroy();
      const result = await this.api.doRequest(
        'append', this._getTarget(element), null, value
      );

      this.notifier.newNotify({
        title: 'append',
        message: `success: ${result.success}`
      });

      if (!result.success) return;

      const item = document.createElement('SPAN');
      const property = document.createElement('SPAN');
      const button = document.createElement('button');
      const array = element.parentNode.querySelector('.array');

      let index = Number(
        array.lastElementChild.dataset.target?.replaceAll('~', '')
      ) + 1 ;
      index = isNaN(index) ? 0 : index;

      if(!array.lastElementChild.dataset.target) {
        array.innerHTML = "";
      }

      item.classList.add('item');
      item.dataset.target = `${index}`;
      item.dataset.type = (options? 'model' : 'String');
      
      button.dataset.verb = 'delete';
      button.classList.add('verb');
      button.innerHTML = 'x';
      
      property.classList.add('verb');
      property.dataset.verb = (options? 'read' : 'edit');
      property.innerHTML = value;

      item.appendChild(button);
      item.appendChild(property);

      array.appendChild(item);

      this.onPropertyEdited(null, value, property);
    };
  }

  _edit(element) {

    const type=this._getType(element);
    let result = {};

    switch(type) {
      
      case 'Boolean':
      case 'Number':
      case 'String':
        
        if (this.inprogress[this._getTarget(element)]) return;
        this.inprogress[this._getTarget(element)] = true ;
        
        this.ed = new TextElementEditor(element);
        this.ed.onCancel = async () => {
          delete this.inprogress[this._getTarget(element)];
        };
        this.ed.onEdited = async (oldVal, newVal, element) => {
          
          if (
            type == 'Boolean' &&
            newVal.toLowerCase()!='true' &&
            newVal.toLowerCase()!='false'
           ){
            result.success = false;
            
            this.notifier.newNotify({
              title: 'edit',
              message: `
                <small>
                  El valor solo puede ser 'true' o 'false'
                </small><br>
                success: ${result.success}`.trim()
            });

          } else if (
            type=='Number' &&
            (isNaN(Number(newVal))) || newVal < 0
           ) {

            result.success = false;            
            this.notifier.newNotify({
              title: 'edit',
              message: `
                <small>
                  El valor debe ser un numero mayor o igual a 0
                </small><br>
                success: ${result.success}`.trim()
            });

          }else{
            result = await this.api.doRequest(
              'edit', this._getTarget(element), oldVal, newVal
            );

            this.notifier.newNotify({
              title: 'edit',
              message: `success: ${result.success}`
            });
          }
          
          if (!result.success){
            this.ed.rollback();
          }
          this.ed.onCancel();
          this.ed._destroy();
          
          this.onPropertyEdited(oldVal, newVal, element);
        };
        break;
    }
  }

  async _create({dataset: {target}}) {

    let className = target.toLowerCase();
    if (className.indexOf('credential')==0) {
      className = className.slice('credential'.length);
    }
    if (className[className.length-1] == 's')
      className = className.slice(0,-1);

    if (this.dialogs[className] != undefined ) return;

    console.log("Creating ", className, "...");

    if (this.authtypes[className] == undefined) {
        const {success, Class} = await this.api.loadClass(className)
        if (!success) throw Error("mala ahi!")
        this.authtypes[className] = Class;
    }

    const onCloseDialog = ()=>{
      console.log("close dialog");     
    }

    this.dialogs[className] = new this.authtypes[className]();    

  }

  eval(string) {
    return window.eval(string);
  }

  onPropertyEdited(oldVal, newVal, element) {
    console.log(
      `Property ${element.dataset.verb}:\n[${this._getTarget(element)}]\n`+
      `oldVal'${oldVal}' newVal'${newVal}'\n`, element
    );
  }
}
/* end editor */

/* app */
class UserManagement {
  constructor() {
    this.notifier = new Notifications();
    this.propetiesEditor = new PropertiesEditor(this.notifier);

  }

}
/* end app */

function main() {
  const userManagemnet = new UserManagement();
}

window.onload = main 