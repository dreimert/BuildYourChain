# Build Your Chain - Consensus

## Objectif

Le but de cette étape est de mettre en place un algorithme de consensus pour notre base de données.

## Consensus

À l'étape précédente, nous avons mis en place un système distribué minimal mais qui fonctionne plus ou moins bien car il n'a pas d'algorithme de consensus. Un algorithme de consensus est un algorithme qui va permettre aux noeuds de se mettre d'accord sur une valeur. Par exemple, si deux valeurs différentes sont proposées pour une même clé, l'algorithme doit permettre d'en choisir une.

Ces désaccords peuvent être dû à :

* des contraintes du monde physique comme la vitesse de la lumière. L'information ne peut pas se téléporter d'un serveur à l'autre, il y a un délai : la latence.
* Il peut y avoir des dysfonctionnements : pannes de matériel ou corruptions de données.
* Il y a des humains qui interagissent avec le système et l'infrastructure, ils peuvent être mal informés, incompétents ou malveillants.

Il n'y a pas de d'algorithme de consensus ultime. Pour pouvoir mettre en place un algorithme de consensus, il faut mettre en place des contraintes qui auront un coup en temps ou en ressources.

## Outch ! Ça lag...

La latence est partout dès qu'il y a communication. L'information ne peut pas aller plus vite que la lumière, sans compter les temps de traitement. Par exemple, à l'heure où j'écris ces lignes, pour l'échange d'un message de ping, il y a 229 millisecondes de latence entre Paris et Tokyo : https://wondernetwork.com/pings. Imaginez maintenant un système distribué de plusieurs milliers de noeuds, le temps que l'information se propage d'un bout à l'autre, il peut se passer plusieurs secondes. Et beaucoup plus si vous voulez transporter une grande qualité d'informations.

Maintenant, imaginez : à quelques millisecondes d'écart, deux noeuds du réseau reçoivent pour la clé `Ville` une valeur différentes :

* Noeud 1 : Ville / Paris
* Noeud 2 : Ville / Tokyo

L'information se propage de proche en proche jusqu'à confrontation. Un partie des noeuds a associé Ville à Paris et pour l'autre, Ville égale Tokyo.

#### Imaginez des solutions possibles. Notez-les, on pourra s'en servir plus tard.

#### Lancez la commande `node scenarios/latence.js`.

## Combattre le temps par le temps

Dans l'idée initiale, on ne peut pas mettre à jour une valeur. Partant de cette idée, il semble cohérent que la valeur la plus vieille soit la bonne. Je vous propose donc l'algorithme de consensus suivant : on garde la valeur la plus vieille.

On n'a pas l'âge d'une valeur pour le moment. Il va falloir la rajouter dans les données stockées mais aussi dans les données échangées pour pouvoir comparer. On ne stocke plus une simple valeur mais un ensemble de valeurs.

```Javascript
db[field] = {
  value: value,
  timestamp: Date.now(), // Retourne le timestamp de la date courante
};
```

Pour commencer, il faut que la commande `set` accepte deux ou trois paramètres. Le troisième paramètre sera le timestamp. Je vous donne le code pour faire ça :

```Javascript
socket.on('set', function(field, value, timestamp, callback) {
  // Dans le cas où il n'y a que deux paramètres, le callback est dans timestamp
  if (typeof timestamp === 'function') {
    // on réaffecte les valeurs aux bonnes variables
    callback = timestamp;
    timestamp = undefined;
  }
  // ...
});
```

J'ai modifier le *CLI* pour qu'il supporte un troisième paramètre optionnel à la commande `set`. J'ai aussi modifier la commande `get` du *CLI* pour qu'elle puisse gérer des retours de type valeur unique ou d'un object contenant une valeur *value*.

#### Modifiez la commande `set` dans `db.js` pour qu'elle supporte deux ou trois paramètres.

#### Modifiez la commande `set` pour qu'elle stocke pour chaque clef la valeur et l'horodatage de celle-ci. Modifiez la manière dont la commande traite les clefs déjà définies pour garder la plus vielle.

##### Indice : `timestamp = timestamp || Date.now()`. Si *timestamp* n'est pas défini, exécute la fonction *now*.

Vous pouvez tester avec `node scenarios/latence.js`. Si votre implémentation est correcte, le réseau devrait converger vers une seule valeur.

Cette solution fonctionne ; tant qu'il n'y a pas de dysfonctionnements ou d'utilisateurs malveillants.

### Désynchronisation

Si un noeud a un problème réseau et que des messages sont perdus, il ne sera jamais mis à jours, même s'il utilise la commande `keys`, celle-ci ne retourne pas l'horodatage de la valeur. Si il a une valeur, il la gardera.

### Attaques

#### Qu'est-ce qui empêche un individu mal intentionné de forger un message `set` avec un *vieux* horodatage ou si l'horloge de la machine est mal réglée ? Que va t'il se passer ?

Cet algorithme fonctionne dans un monde parfait, sans panne et personnes malintentionnées. Essayons de faire plus résistant.

## Résistance aux pannes

Le problème d'une panne réseau est que le noeud ne reçoit pas la mise à jour de la valeur. Une solution est de vérifier régulièrement que l'on a bien la même chose que ses voisins.

Vous pouvez voir une illustration en lançant la commande `node scenarios/panne.js`.

Actuellement, la commande `keys` ne retourne que la liste des clés mais pas l'horodatage. Avec celle-ci, on ne peut pas savoir si une clé a changée. Le code suivant permet d'extraire uniquement le champs *timestamp* de chaque clé de la base de données.

```Javascript
const extractHorodatage = function(db) {
  return Object.keys(db).reduce(function(result, key) {
    result[key] = {
      timestamp: db[key].timestamp
    };
    return result;
  }, {});
};
// Si db = {a: {value: 'Dublin', timestamp: 123456789}}
// retourne : {a: {timestamp: 123456789}}
```

#### Écrivez une commande `keysAndTime` qui retourne la liste des clés avec l'horodatage.

Il ne reste plus qu'à appeler la commande la commande `keysAndTime` à la place de `keys` à la synchronisation pour détecter une désynchronisation et la corriger. Quand vous corrigez la valeur, informez vos voisins qui sont peut-être aussi désynchronisés.

#### Mettez en place la mécanique de détection et de correction.

##### Indice :

```Javascript
for (let key in object) {
  if (object.hasOwnProperty(key)) {
    console.log(object[key]);
  }
}
// Si object vaut : {a: {timestamp: 123456789}}
// Affiche : {timestamp: 123456789}
```

#### Notifiez les voisins du changement.

#### Vérifier le bon fonctionnement en exécutant `node scenarios/panne.js`.

## C'est toujours un problème de temps

Dans la vie, je suis plutôt optimiste mais en informatique si ça peut mal se passer, ça se passera mal. Et puis, j'ai besoin de ce ressort scénaristique de fou pour vous amener là où je veux : La solution précédente fonctionne ? Vous êtes sûr ?

#### Que se passe-t'il si pour un même timestamp, il y a deux valeurs différentes ?

#### Lancez `node scenarios/horloge.js` et observez.

Mais on n'a pas envie d'envoyer la valeur à chaque synchronisation. Imaginez si c'est un fichier de plusieurs centaines de Mo ! À la place, on va utiliser l'empreinte de la valeur qui est produite par une fonction de hachage.

## Prenons un peu de *hash*

Une fonction de hachage est une fonction qui prend en entrée un ensemble de données et retourne une empreinte, aussi appelée *hash*. L'empreinte respecte deux principes : Elle est unique pour un ensemble de données d'entrée, et une empreinte donnée ne permet pas de remonter à l'ensemble initial. On parle de non-collision et de non calculabilité de la pré-image. Cette empreinte est de taille fixe quelque-soit l'entrée. Une fonction couramment utilisé est SHA. Voici quelques exemples d'empreinte :

```Bash
> echo "Blockchain" | shasum
# efcf8baf5959ad1ebc7f4950425ef1c2eae9cbd9  -

> echo "Block" | shasum
# d1a6b1157e37bdaad78bec4c3240f0d6c576ad21  -

> echo "Vous commencez à voir le principe ?" | shasum
# 25abec7ced7642b886c1bffbc710cc3439f23ab7  -
```

Une propriété intéressante est qu'une petite modification dans l'entrée change totalement l'empreinte :

```Bash
> echo "Blockchain" | shasum
# efcf8baf5959ad1ebc7f4950425ef1c2eae9cbd9  -

> echo "blockchain" | shasum
# ea5f179324c233b002fa8ac4201fa216001515e5  -
```

Les fonctions de hachage sont couramment utilisées pour vérifier que des données n'ont pas été corrompu lors d'un téléchargement par exemple. Le code suivant permet de produire une empreinte en Javascrip.

```Javascript
const crypto = require('crypto');

// Retourne l'empreinte de data.
const getHash = function getHash(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
```

## Spoiler : cette fois, c'est la bonne ... avant l'étape suivante.

#### Ajoutez un champs `hash` dans votre base de données.

#### Modifiez `set` pour calculer l'empreinte de la valeur.

#### Modifiez `set` pour qu'en cas de timestamp identique mais hash différent, on retient le plus petit.

#### Éditez la commande `keysAndTime` pour ajouter le hash.

#### Modifiez votre algorithme de synchronisation pour vérifier le hash et appliquer les modifications comme pour `set`.

#### Lancez `node scenarios/horloge.js` et observez.

Vous êtes maintenant résistant à la panne. Enfin, pas à l'instant T mais c'est déjà pas mal !

## Conclusion

Nous avons mis en place un algorithme de consensus qui résiste aux problèmes de latence et de pannes réseaux. Pour résister, nous avons ajouter des données et mis en place des échanges d'informations supplémentaires, ce qui représente un coût.

Nous n'avons pas traité le troisième cas de désaccords dù à un utilisateur potentiellement malveillants. Nous traiteront se problème à l'étape suivante.

## Suite

Aller à l'étape 3 : `git checkout etape-3`.

Pour continuer à lire le sujet :

* soit vous lisez le fichier `README.md` sur votre machine.
* soit sur GitHub, au-dessus de la liste des fichiers, vous pouvez cliquer sur `Branch: master` et sélectionner `etape-3`.
