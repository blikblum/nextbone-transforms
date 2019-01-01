function MyClass () {
  this.Model = class extends Backbone.Model {};
}

function MyClass2 () {
  this.Model = @validation({
    name: function (val) {
        if (!val) {
            return 'error';
        }
    }
  }) class extends Backbone.Model {};
}

module.exports = class extends Backbone.Model {};

export default class extends Backbone.Model {};