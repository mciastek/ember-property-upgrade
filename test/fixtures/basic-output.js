const Person = EmberObject.extend({
  fullName: Ember.computed('firstName', 'lastName', function () {
    return `${this.firstName} ${this.lastName}`;
  })
});