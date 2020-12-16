const networkTools = require('../tools/network');
const cliTools = require('../tools/cli');

console.info("Lancement de deux clusters a-m et n-z ...");

const getMapping = () => {
  return Promise.all("abcdefghijklmnopqrstuvwxyz".split('').map((node) => {
    return cliTools.execCommande(`node ./cli.js --port=${networkTools.network[node].port} --bot=true get Ville`).then((v) => {
      return `${node} => ${v.substring(0, 5)}`;
    });
  }));
};

// Lancement d'une chaine de 26 noeuds
networkTools.runNetwork(networkTools.parseTopology("a-b b-c c-d d-e e-f f-g g-h h-i i-j j-k k-l l-m n-o o-p p-q q-r r-s s-t t-u u-v v-w w-x x-y y-z")).then(() => {
  // Mise en place de deux valeurs diffèrentes à chaque bout
  console.info("Attribution de la valeur Paris pour a et Tokio pour z.")
  return Promise.all([
    // Initialisation de a avec Paris
    cliTools.execCommande(`node ./cli.js --port=${networkTools.network['a'].port} --bot=true set Ville Paris`)
  ,
    // Initialisation de z avec Tokio
    cliTools.execCommande(`node ./cli.js --port=${networkTools.network['z'].port} --bot=true set Ville Tokio`)
  ]);
}).then(
  networkTools.wait(3000) // On attend 3 secondes. C'est complémentement arbitraire.
).then(() => {
  console.info("On connecte les deux clusters...");
  return networkTools.runNetwork(networkTools.parseTopology("m-n"))
}).then(
  networkTools.wait(3000) // On attend 3 secondes. C'est complémentement arbitraire.
).then(getMapping).then((liste) => {
  console.info(liste);
  console.info('Arrêtez ce programme pour arrêter l\'ensemble des noeuds lancés ou laissez le tourner pour pouvoir les explorer.');
}).catch((err) => {
  console.error('Oups...', err)
});
