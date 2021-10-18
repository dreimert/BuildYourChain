const tape = require('tape');
const _test = require('tape-promise').default
const test = _test(tape) // decorate tape

const Block = require('./Block');

const first  = new Block(0, null, "bienvenue", "Bienvenue à vous !");
first.pow();
const second = new Block(1, first.id, "miner", "La fonction pow cherche un id de block valide.");
second.pow();
const third  = new Block(2, second.id, "oubli", "Il ne faut donc pas oublier de l'appeler.");
third.pow();

console.log(first);

test('Vérification des index', function (t) {
  t.plan(3);
  t.equal(first.index, 0);
  t.equal(second.index, 1);
  t.equal(third.index, 2);
});

test('Vérification des clefs', function (t) {
  t.plan(3);
  t.equal(first.key, "bienvenue");
  t.equal(second.key, "miner");
  t.equal(third.key, "oubli");
});

test('Vérification des valeurs', function (t) {
  t.plan(3);
  t.equal(first.value, "Bienvenue à vous !");
  t.equal(second.value, "La fonction pow cherche un id de block valide.");
  t.equal(third.value, "Il ne faut donc pas oublier de l'appeler.");
});

test('Vérification des ids', function (t) {
  t.plan(3);
  t.equal(first.id, '000f8afdb874997f2ae63bfd2242dc773b66f4b03c23d21e204f9044c758909d');
  t.equal(second.id, '00085fad09c84e05153d748e5d18ead7c4bac22502e7bb31932dc676750287a1');
  t.equal(third.id, '00060311750497a4088e16cc43047174c0f28b699cc13a6705b3900cde730c3e');
});

test('Vérification des previous', function (t) {
  t.plan(3);
  t.equal(first.previous, null);
  t.equal(second.previous, '000f8afdb874997f2ae63bfd2242dc773b66f4b03c23d21e204f9044c758909d');
  t.equal(third.previous, '00085fad09c84e05153d748e5d18ead7c4bac22502e7bb31932dc676750287a1');
});

test('Vérification de isValid', function (t) {
  t.plan(5);
  t.equal(first.isValid(), true);
  t.equal(second.isValid(), true);
  t.equal(third.isValid(), true);

  first.id = "0000000000";

  t.equal(first.isValid(), false);

  first.nonce = 0;
  first.id = '100397b9e52a6c43d1ef031661d15e5b63eab2b8b1fe6421f486d7c8a1796fe4';

  t.equal(first.isValid(), false);

  first.nonce = 1568;
  first.id = '000f8afdb874997f2ae63bfd2242dc773b66f4b03c23d21e204f9044c758909d';

});

test('Vérification de getHash', function (t) {
  t.plan(3);
  t.equal(first.getHash(), '000f8afdb874997f2ae63bfd2242dc773b66f4b03c23d21e204f9044c758909d');
  t.equal(second.getHash(), '00085fad09c84e05153d748e5d18ead7c4bac22502e7bb31932dc676750287a1');
  t.equal(third.getHash(), '00060311750497a4088e16cc43047174c0f28b699cc13a6705b3900cde730c3e');
});
