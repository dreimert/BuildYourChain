const crypto = require('crypto')

// data sera de type string
module.exports = function pow (data, difficulty = 3) {
  let nonce = -1
  let hash

  do {
    nonce += 1
    hash = crypto.createHash('sha256').update(`${data}${nonce}`, 'utf8').digest('hex')
  } while (!hash.startsWith('0'.repeat(difficulty)))

  return nonce // retournez un nombre
}
