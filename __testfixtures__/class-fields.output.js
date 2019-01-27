import { Model, Collection as BBCollection, Router } from "nextbone"


class MyModel extends Model {
  static cidPrefix = 'x';
  static idAttribute = '_id';

  anObject = {
    x: 'y'
  };

  static defaults = {
    a: 1
  };

  aFunction(arg) {
    console.log(arg)
  }

  aMethod() {
    this.doIt()
  }
}

class MyCollection extends BBCollection {
  static model = MyModel;

  options = {
    a: 'b'
  };
}

class MyRouter extends Router {
  static routes = {
    a: 'b'
  };

  b() {

  }
}

