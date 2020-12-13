const tape = require('tape');
const net = require('net');
const fs = require('fs');

const { exec, spawn } = require("child_process");

function execCommande(cmd, t) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        t.error(error);
        if (error.code == 126) {
          t.comment("Avez-vous fait un `chmod +x db.js` ?");
        }
        t.end();
        return reject(error);
      }
      return resolve(stdout);
    });
  });
}

tape('Vérification de la version', function (t) {
  execCommande("./db.js --version", t).then((stdout) => {
    t.equal(stdout, '1.0.0\n', "Numero de version");
    t.end();
  });
});

function isPortTaken(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
       .once('error', err => (err.code == 'EADDRINUSE' ? resolve(false) : reject(err)))
       .once('listening', () => tester.once('close', () => resolve(true)).close())
       .listen(port)
  });
}

let serveur;

tape('Démarrage du serveur sur le port 3000', function (t) {
  isPortTaken(3000).then((ok) =>{
    t.ok(ok, "Port disponible");
    if (!ok) {
      t.comment("Avez-vous bien arrêté tous les serveurs en cours d'exécution ?");
    }
  }).then(() => {
    const out = fs.openSync('./serveur.log', 'a');
    const err = fs.openSync('./serveur.err', 'a');

    serveur = spawn("./db.js", ["--port=3000"], {
      stdio: [ 'ignore', out, err ],
    });

    t.end();
  })
});

tape('Affectation de la valeur "Reimert" à la clef "name"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true set name Reimert", t).then((stdout) => {
    t.equal(stdout, 'true\n', "Set réussi");
    t.end();
  });
});

tape('Récupération de la valeur associé à la clef "name"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true get name", t).then((stdout) => {
    t.equal(stdout, 'Reimert\n', "Valeur correct");
    t.end();
  });
});

tape('Récupération de la valeur associé à la clef "jeNeSuisPasDef"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true get jeNeSuisPasDef", t).then((stdout) => {
    t.equal(stdout, 'null\n', "Retour null");
    t.end();
  });
});

tape('Affectation de la valeur "Frenot" à la clef "name"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true set name Frenot", t).then((stdout) => {
    t.equal(stdout, 'false\n', "Set doit échouer car la valeur change");
    t.end();
  });
});

tape('Récupération de la valeur associé à la clef "name"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true get name", t).then((stdout) => {
    t.equal(stdout, 'Reimert\n', "Valeur correct");
    t.end();
  });
});

tape('Réaffectation de la valeur "Reimert" à la clef "name"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true set name Reimert", t).then((stdout) => {
    t.equal(stdout, 'true\n', "Set doit réussir car la valeur ne change pas. Cf. protocole.");
    t.end();
  });
});

tape('Récupération de la valeur associé à la clef "name"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true get name", t).then((stdout) => {
    t.equal(stdout, 'Reimert\n', "Valeur correct");
    t.end();
  });
});

tape('Récupération de la list des clefs', function (t) {
  execCommande("./cli.js --port=3000 --bot=true keys", t).then((stdout) => {
    t.equal(stdout, 'name\n', "Valeur correct");
    t.end();
  });
});

tape('Affectation de la valeur "Frenot" à la clef "directeur"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true set directeur Frenot", t).then((stdout) => {
    t.equal(stdout, 'true\n', "Set doit réussir");
    t.end();
  });
});

tape('Récupération de la valeur associé à la clef "directeur"', function (t) {
  execCommande("./cli.js --port=3000 --bot=true get directeur", t).then((stdout) => {
    t.equal(stdout, 'Frenot\n', "Valeur correct");
    t.end();
  });
});

tape('Récupération de la list des clefs', function (t) {
  execCommande("./cli.js --port=3000 --bot=true keys", t).then((stdout) => {
    t.equal(stdout, 'name,directeur\n', "Valeur correct");
    t.end();
  });
});

tape('Kill serveur', function (t) {
  t.ok(serveur.kill(), "Arret du serveur");
  t.end();
});
