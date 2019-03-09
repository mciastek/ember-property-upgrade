import EmberObject, { computed } from '@ember/object';

Person = EmberObject.extend({
  // these will be supplied by `create`
  firstName: null,
  lastName: null,

  powers: [],

  fullName: function() {
    return `${this.firstName} ${this.lastName}`;
  }.property('firstName', 'lastName'),

  mainPower: function() {
    return this.powers[0]
  }.property('powers')
});

let ironMan = Person.create({
  firstName: 'Tony',
  lastName:  'Stark',
  powers: ['super-smart']
});

ironMan.fullName; // "Tony Stark"