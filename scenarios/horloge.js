const networkTools = require('../tools/network');
const cliTools = require('../tools/cli');

console.info("Lancement d'un chaine de 26 noeuds de a à z...");

// Lancement d'une chaine de 26 noeuds
networkTools.runNetwork(networkTools.parseTopology("a-b b-c c-d d-e e-f f-g g-h h-i i-j j-k k-l l-m m-n n-o o-p p-q q-r r-s s-t t-u u-v v-w w-x x-y y-z")).then(() => {
  // Mise en place de deux valeurs diffèrentes à chaque bout
  console.info("Attribution de la valeur Paris pour a et Tokio pour z.")
  return Promise.all([
    // Initialisation de a avec Paris
    cliTools.execCommande(`node ./cli.js --port=${networkTools.network['a'].port} --bot=true set Ville Paris 1234567890`)
  ,
    // Initialisation de z avec Tokio
    cliTools.execCommande(`node ./cli.js --port=${networkTools.network['z'].port} --bot=true set Ville Tokio 1234567890`)
  ]);
}).then(
  networkTools.wait(5000) // On attend 5 secondes. C'est complémentement arbitraire.
).then(() => {
  console.info('Recherche des valeurs de chaque noeuds');
  return Promise.all("abcdefghijklmnopqrstuvwxyz".split('').map((node) => {
    return cliTools.execCommande(`node ./cli.js --port=${networkTools.network[node].port} --bot=true get Ville`).then((v) => {
      return `${node} => ${v.substring(0, 5)}`;
    });
  })).then((liste) => {
    console.info(liste);
    console.info('Arrêtez ce programme pour arrêter l\'ensemble des noeuds lancés ou laissez le tourner pour pouvoir les explorer.');
  });
}).catch((err) => {
  console.error('Oups...', err)
});
