
 export default class CreateSimpleCredentialFrontEnd extends Dialog {
    constructor({onSuccess, onCancel}) {
      super({
        properties: {
          name: { type: 'text'},
          userfacade: { type: 'text'},
          password: { type: 'password'}
        },
        title: '<small>new</small> Simple <small>credential</small>',
        submitCaption: 'create'
      });

      this.onSuccess = onSuccess;
      this.onCancel = onCancel;
    }
    
  }
