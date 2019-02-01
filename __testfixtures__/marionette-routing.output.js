import {Route} from "nextbone-routing";
import {Contacts} from '../entities';
import ContactsView from './view';

export default class extends Route {
  activate() {
    this.contacts = new Contacts(contactsData)
  }

  static component = ContactsView;

  viewOptions() {
    return {
      contacts: this.contacts
    }
  }

  static childRoutes = {
    child: 'test'
  };

  static contextRequests = {
    contacts: function () {
      return this.contacts
    }
  };

  static contextEvents = {
    'my:event': function() {
      console.log('my:event')
    }
  };
};