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
const crypto = require('crypto')

// Création de la DB
const db = Object.create(null)
const neighbors = []
const sockets = []

function getKeysAndSetUnknow (socket) {
  socket.emit('keysAndTime', (keys) => {
    console.info('addPeer::keys to', socket.id, '->', keys)
    for (const key in keys) {
      if (keys.hasOwnProperty(key)) {
        if (!db[key] || db[key].timestamp > keys[key].timestamp || (db[key].timestamp === keys[key].timestamp && db[key].hash > keys[key].hash)) {
          socket.emit('get', key, (value) => {
            console.info('addPeer::get', key, ' to', socket.id, '->', value)
            updateField(key, value.value, value.timestamp, value.hash)
          })
        }
      }
    }
  })
}

function updateField (field, value, timestamp, hash) {
  db[field] = {
    value: value,
    timestamp: timestamp,
    hash: hash
  }

  sockets.forEach((socket, index) => {
    socket.emit('set', field, value, timestamp, (ok) => {
      console.info('set to', socket.id, '->', ok)
    })
  })
}

const extractHorodatage = function (db) {
  return Object.keys(db).reduce(function (result, key) {
    result[key] = {
      timestamp: db[key].timestamp,
      hash: db[key].hash
    }
    return result
  }, {})
}

// Initialisation d'une socket
function initSocket (socket) {
  socket.on('get', function (field, callback) {
    console.info(`get ${field}: ${db[field]}`)
    callback(db[field]) // lit et renvoie la valeur associée à la clef.
  })

  socket.on('set', function (field, value, timestamp, callback) {
    // Dans le cas où il n'y a que deux paramètres, le callback est dans timestamp
    if (typeof timestamp === 'function') {
      // on réaffecte les valeurs aux bonnes variables
      callback = timestamp
      timestamp = Date.now()
    }

    const hash = crypto.createHash('sha256').update(value, 'utf8').digest('hex')

    if (field in db) { // Si la clef est dans la base de donnée
      if (db[field].timestamp > timestamp) {
        updateField(field, value, timestamp, hash)
        callback(true)
      } else if (db[field].timestamp < timestamp) {
        console.info(`set error for field ${field} : the timestamp is too recent.`)
        callback(false)
      } else if (db[field].timestamp === timestamp) {
        if (db[field].value === value) {
          callback(true)
        } else if (db[field].hash <= hash) {
          callback(false)
        } else {
          updateField(field, value, timestamp, hash)
          callback(true)
        }
      } else {
        console.info(`set error : Field ${field} exists.`)
        callback(false)
      }
    } else {
      console.info(`set ${field} : ${value}`)

      updateField(field, value, timestamp, hash)

      callback(true)
    }
  })

  socket.on('keys', function (callback) {
    console.info('keys')
    callback(Object.keys(db)) // Object.keys() extrait la liste des clefs d'un object et les renvoie sous forme d'un tableau.
  })

  socket.on('keysAndTime', function (callback) {
    console.info('keysAndTime')
    callback(extractHorodatage(db))
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
