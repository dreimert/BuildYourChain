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

// Création de la DB
const db = Object.create(null)
const neighbors = []
const sockets = []

function getKeysAndSetUnknow (socket) {
  socket.emit('keys', (keys) => {
    console.info('addPeer::keys to', socket.id, '->', keys)
    keys.forEach((key, i) => {
      if (!db[key]) {
        socket.emit('get', key, (value) => {
          console.info('addPeer::get', key, ' to', socket.id, '->', value)
          db[key] = value
        })
      }
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
      if (db[field] === value) {
        callback(true)
      } else {
        console.info(`set error : Field ${field} exists.`)
        callback(false)
      }
    } else {
      console.info(`set ${field} : ${value}`)

      db[field] = value

      sockets.forEach((socket, index) => {
        socket.emit('set', field, value, (ok) => {
          console.info('set to', socket.id, '->', ok)
        })
      })

      callback(true)
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

        getKeysAndSetUnknow(neighborSocket)
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

      getKeysAndSetUnknow(socket)

      callback(true)
    }
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
