const Person = EmberObject.extend({
  lastName: computed('lastName', function() {
    return this.lastName;
  }),
  firstName: 'Joe',
});
