const tape = require('tape');
const _test = require('tape-promise').default
const test = _test(tape) // decorate tape

const pow = require('./pow');

test('Vérification de la PoW', function (t) {
  t.equal(pow("test"), 338, "test - 3");
  t.equal(pow("test", 4), 93721, "test - 4");
  t.equal(pow("toto"), 4678, "toto - 3");
  t.equal(pow("toto", 4), 4678, "toto - 4");
  t.equal(pow("Kamelot"), 1652, "Kamelot - 3");
  t.equal(pow("Kamelot", 4), 240925, "Kamelot - 4");
  t.equal(pow("Kamelot", 5), 240925, "Kamelot - 5");
  t.equal(pow("Kamelot", 6), 16410583, "Kamelot - 6");
  t.end();
});
