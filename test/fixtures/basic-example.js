const Person = EmberObject.extend({
  fullName: computed(function() {
    return `${this.firstName} ${this.lastName}`;
  }).property('firstName', 'lastName'),
  isYoung: Ember.computed(function() {
    return this.age < 50;
  }).property('age'),
  hasFriends: function() {
    return this.friends.length > 0;
  }.property('friends'),
});