function MyClass () {
  this.Model = Backbone.Model.extend({});
}

function MyClass2 () {
  this.Model = Backbone.Model.extend({
    validation: {
        name: function (val) {
            if (!val) {
                return 'error';
            }
        }
    }
  });
}

module.exports = Backbone.Model.extend({});

export default Backbone.Model.extend({});