const Person = EmberObject.extend({
  fullName: comput(function() {
    return `${this.firstName} ${this.lastName}`;
  }.property('firstName', 'lastName')),
  lastName: computed('lastName', function() {
    return this.lastName;
  }),
  firstName: 'Joe',
  save() {
    this.set('saved', true);
  }
});