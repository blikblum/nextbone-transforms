import Backbone from "nextbone"

import { computed } from "nextbone/computed";
import { validation } from "nextbone/validation";

@validation({
  name: {
    required: true
  },
  age: {
    pattern: 'number'
  }
})
class MyModel extends Backbone.Model {}

@validation({
  name: {
    required: true
  }
})
class MyModel2 extends Backbone.Model {}

@computed({
  fullName: {
    depends: ['name'],
    get: function(values) {
      return values.name
    }
  }
})
class MyModel3 extends Backbone.Model {}

class MyCollection extends Backbone.Collection {}