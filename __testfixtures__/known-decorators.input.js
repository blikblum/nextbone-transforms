import Backbone from 'backbone'

const MyModel = Backbone.Model.extend({
  validation: {
    name: {
      required: true
    },
    age: {
      pattern: 'number'
    }
  }
})

const MyModel2 = Backbone.Model.extend({
  validation: {
    name: {
      required: true
    }
  }
})

const MyModel3 = Backbone.Model.extend({
  computed: {
    fullName: {
      depends: ['name'],
      get: function(values) {
        return values.name
      }
    }
  }
})

const MyCollection = Backbone.Collection.extend({
  
})

