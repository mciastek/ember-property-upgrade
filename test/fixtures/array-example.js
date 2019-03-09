const Person = EmberObject.extend({
  friendNames: map('friends', function(friend) {
    return friend[this.get('nameKey')];
  }).property('nameKey'),
  friendsSorted: Ember.sort('friends', function(a, b) {
    return a[this.get('nameKey')] - b[this.get('nameKey')];
  }).property('nameKey'),
  friendsFiltered: filter('friends', function(friend) {
    return this.get('age') < 50;
  }).property('age')
});