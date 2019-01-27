import {Route} from 'marionette.routing';
import {Contacts} from '../entities';
import ContactsView from './view';

export default Route.extend({
  activate(){
    this.contacts = new Contacts(contactsData)
  },

  viewClass: ContactsView,

  viewOptions() {
    return {
      contacts: this.contacts
    }
  },

  contextRequests: {
    contacts: function () {
      return this.contacts
    }
  },

  contextEvents: {
    'my:event': function() {
      console.log('my:event')
    }
  }
})