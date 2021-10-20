const crypto = require('crypto')

module.exports = class Block {
  constructor (index, previous, key, value, nonce = 0) {
    // Le mot clé `this` permet d'accèder aux propriétés de l'object depuis ses méthodes.
    this.index = index
    this.previous = previous
    this.key = key
    this.value = value
    this.nonce = nonce
    this.difficulty = 3

    this.id = this.getHash()
  }

  // Retourne l'identifiant du block en le calculant depuis les données
  getHash () {
    return crypto.createHash('sha256').update(`${this.index}${this.previous}${this.key}${this.value}${this.nonce}`, 'utf8').digest('hex')
  }

  // Retourne un boolean qui indique si le block est valide
  isValid () {
    return this.getHash() === this.id && this.id.startsWith('0'.repeat(this.difficulty))
  }

  // Permet de trouver une empreinte valide
  pow () {
    while (!this.getHash().startsWith('0'.repeat(this.difficulty))) {
      this.nonce++
    }

    this.id = this.getHash()

    return this.nonce // retournez un nombre
  }
}
