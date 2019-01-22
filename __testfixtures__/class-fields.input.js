import { Model, Collection as BBCollection } from 'backbone'


const MyModel = Model.extend({
  cidPrefix: 'x',
  idAttribute: '_id',
  anObject: {
    x: 'y'
  },
  aFunction: function(arg) {
    console.log(arg)
  },
  aMethod() {
    this.doIt()
  }
})


const MyCollection = BBCollection.extend({
  model: MyModel,
  options: {
    a: 'b'
  }
})
