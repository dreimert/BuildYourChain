#!/usr/bin/env node

// Analyse des paramètres
const argv = require('yargs')
  .option('port', {
    alias: 'p',
    default: '3000',
    description: 'port à utiliser'
  })
  .option('version', {
    description: 'Affiche la version de la db'
  })
  .help()
  .argv

// Si l'utilisateur demande la verion
if (argv.version) {
  console.log('1.0.0')
  process.exit(0) // met fin au programme
}

const ioClient = require('socket.io-client')

const Block = require('./Block.js')

// Création de la DB
const db = Object.create(null)
const neighbors = []
const sockets = []
const blockchain = []

function findBlock (id) {
  return blockchain.find((block) => {
    return block.id === id
  })
}

function syncBlockchain (socket) {
  socket.emit('last', (block) => {
    console.info('syncBlockchain::last to', socket.id, '->', block)
    if (!block) {
      return
    }
    syncBlock(socket, block, (ok, blocks) => {
      if (ok) {
        blocks.forEach((block, i) => {
          updateBlockchain(block)
        })
      }
    })
  })
}

function syncBlock (socket, block, callback) {
  const find = findBlock(block.id)

  if (find) {
    if (
      block.index === find.index &&
      block.previous === find.previous &&
      block.key === find.key &&
      block.value === find.value &&
      block.nonce === find.nonce
    ) {
      return callback(true, [block])
    } else {
      console.info(`syncBlock error : block ${block.id} diverge.`)
      return callback(false)
    }
  } else if (!block.previous) {
    if (block.index === 0) {
      return callback(true, [block])
    } else {
      console.info(`syncBlock error : block ${block.id} with index ${block.index} must have previous.`)
      return callback(false)
    }
  } else {
    const previous = findBlock(block.previous)

    if (previous) {
      if (previous.index === block.index - 1) {
        return callback(true, [block])
      } else {
        console.info(`syncBlock error : block ${block.id} and ${previous.id} not have index increment.`)
        return callback(false)
      }
    } else {
      socket.emit('block', block.index - 1, (prev) => {
        console.info('syncBlock::block', block.index - 1, 'to', socket.id, '->', prev)
        if (!prev) {
          return callback(false)
        } else {
          return syncBlock(socket, prev, (ok, list = []) => {
            callback(ok, list.concat([block]))
          })
        }
      })
    }
  }
}

function updateBlockchain (block) {
  console.log('updateBlockchain index', block.index, 'and key / value', block.key, '/', block.value)
  blockchain.push(block)
  db[block.key] = block

  sockets.forEach((socket, index) => {
    socket.emit('setBlock', block, (ok) => {
      console.info('setBlock to', socket.id, '->', ok)
    })
  })
}

// Initialisation d'une socket
function initSocket (socket) {
  socket.on('get', function (field, callback) {
    console.info(`get ${field}: ${db[field]}`)
    callback(db[field]) // lit et renvoie la valeur associée à la clef.
  })

  socket.on('set', function (field, value, callback) {
    if (field in db) { // Si la clef est dans la base de donnée
      console.info(`set error : Field ${field} exists.`)
      callback(false)
    } else {
      console.info(`set ${field} : ${value}`)

      const block = new Block(blockchain.length, blockchain[blockchain.length - 1]?.id, field, value)

      block.pow()
      updateBlockchain(block)

      callback(true)
    }
  })

  socket.on('setBlock', function (block, callback) {
    block = new Block(block.index, block.previous, block.key, block.value, block.nonce)

    if (!block.isValid()) {
      console.info(`setBlock error : block not valid.`)
      callback(false)
    } else if (block.index < blockchain.length) {
      console.info(`setBlock error : block index to small.`)
      callback(false)
    } else {
      syncBlock(socket, block, (ok, blocks) => {
        if (ok) {
          blocks.forEach((block, i) => {
            updateBlockchain(block)
          })
          callback(ok)
        } else {
          callback(ok)
        }
      })
    }
  })

  socket.on('keys', function (callback) {
    console.info('keys')
    callback(Object.keys(db)) // Object.keys() extrait la liste des clefs d'un object et les renvoie sous forme d'un tableau.
  })

  socket.on('peers', function (callback) {
    console.info('peers')
    callback(neighbors)
  })

  socket.on('addPeer', function (port, callback) {
    console.info('addPeer', port)
    if (neighbors.includes(port)) {
      callback(false)
    } else {
      neighbors.push(port)

      const neighborSocket = ioClient(`http://localhost:${port}`, {
        path: '/byc'
      })

      neighborSocket.on('connect', () => {
        console.info('addPeer::connect to', port, neighborSocket.id)

        initSocket(neighborSocket)
        sockets.push(neighborSocket)

        neighborSocket.emit('auth', argv.port, (ok) => {
          console.info('addPeer::auth to', port, neighborSocket.id, '->', ok)
          callback(ok)
        })

        syncBlockchain(neighborSocket)
      })
    }
  })

  socket.on('auth', function (port, callback) {
    console.info('auth', port, socket.id)
    if (neighbors.includes(port)) {
      callback(false)
    } else {
      neighbors.push(port)
      sockets.push(socket)

      syncBlockchain(socket)

      callback(true)
    }
  })

  socket.on('last', function (callback) {
    console.info('last')
    callback(blockchain[blockchain.length - 1])
  })

  socket.on('block', function (index, callback) {
    console.info('block', index)
    callback(blockchain[index])
  })
}

// Création du serveur
const io = require('socket.io')(argv.port, {
  path: '/byc',
  serveClient: false
})

console.info(`Serveur lancé sur le port ${argv.port}.`)

// À chaque nouvelle connexion
io.on('connect', (socket) => {
  console.info('Nouvelle connexion')
  initSocket(socket)
})
