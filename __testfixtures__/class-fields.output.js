import { Model, Collection as BBCollection } from "nextbone"


class MyModel extends Model {
  static cidPrefix = 'x';
  static idAttribute = '_id';

  anObject = {
    x: 'y'
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

