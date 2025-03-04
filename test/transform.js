/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('chai').should();
const json2json = require('../');

const json = {
  breakfastMenuMap: {
    name: 'Belgian Waffles',
    price: '$5.95'
  },
  breakfastMenuArray: [
    { name: 'Belgian Waffles', price: '$5.95' }
  ],
  sportsTeams: [
    { id: 'yankees', name: 'New York Yankees', players: [ 'Alex', 'Starlin' ] },
    { id: 'cubs', name: 'Chicago Cubs', players: 'Jason' }
  ],
  user: {
    name: 'Bob',
    title: '',
    age: undefined,
    email: null
  }
};

describe('ObjectTemplate', function() {

  describe('#transform()', function() {

    it('should wrap the property in an array if `ensureArray` is `true`', () => new json2json.ObjectTemplate({ path: 'breakfastMenuMap', ensureArray: true, all: true })
      .transform(json)
      .should.deep.equal([ { name: 'Belgian Waffles', price: '$5.95' } ]));

    it('should not modify the property if it is already an array even if `ensureArray` is `true`', () => new json2json.ObjectTemplate({ path: 'breakfastMenuArray', ensureArray: true, all: true })
      .transform(json)
      .should.deep.equal([ { name: 'Belgian Waffles', price: '$5.95' } ]));

    it('should wrap the map values in array when `key` and `value` are set and `ensureArray` is `true`', () => new json2json.ObjectTemplate({ path: 'sportsTeams', key: 'id', value: 'players', ensureArray: true })
      .transform(json)
      .cubs.should.deep.equal([ 'Jason' ]));

    it('does not include properties with a `null` or `undefined` value by default', () => new json2json.ObjectTemplate({ path: 'user', all: true })
      .transform(json)
      .should.include.keys([ 'name', 'title' ])
      .should.not.include.keys([ 'age', 'email' ]));

    it('includes properties with a `null` or `undefined` value if `ignoreEmpty` is `false`', () => new json2json.ObjectTemplate({ path: 'user', all: true, ignoreEmpty: false })
      .transform(json)
    .should.include.keys([ 'age', 'email' ]));

    return it('should get defaults from `TemplateConfig.defaults`', function() {
      new json2json.ObjectTemplate({ path: 'user', all: true })
        .transform(json)
        .should.not.include.keys([ 'age', 'email' ]);

      json2json.TemplateConfig.defaults.path = 'thisWillBeOverwritten';
      json2json.TemplateConfig.defaults.ignoreEmpty = false;

      return new json2json.ObjectTemplate({ path: 'user', all: true  })
        .transform(json)
        .should.include.keys([ 'age', 'email' ]);
  });
});

  return describe('mapToArray', function() {

        it('should extract all the property values into the array', () => new json2json.ObjectTemplate({ path: 'breakfastMenuMap', key: false, mapToArray: true, as: false })
          .transform(json)
        .should.deep.equal(['Belgian Waffles','$5.95']));

        it('should extract all the property values of each map into a nested array', function() {
          let what;
          return what = new json2json.ObjectTemplate({ path: 'sportsTeams', key: false, mapToArray: true, as: false})
            .transform(json)
            .should.deep.equal([['yankees', 'New York Yankees', [ 'Alex', 'Starlin' ]], ['cubs', 'Chicago Cubs', 'Jason']]);
      });

        it('should extract only the specified properties of each map into a nested array', function() {
          let what;
          return what = new json2json.ObjectTemplate({ path: 'sportsTeams', key: false, mapToArray: true, as: false, choose: ['id']})
            .transform(json)
            .should.deep.equal([['yankees'], ['cubs']]);
      });

        return it('should extract only the specified properties of each map into a flattened array', function() {
          let what;
          return what = new json2json.ObjectTemplate({ path: 'sportsTeams', key: false, mapToArray: true, as: false, choose: ['id'], flatArray: true })
            .transform(json)
            .should.deep.equal(['yankees', 'cubs']);
      });
});
});
