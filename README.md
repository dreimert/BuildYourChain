# Build Your Chain - P2P

## Objectif

Les buts de cette étape sont :

* Transformer notre base de données client / serveur en une base distribuée.
* Comprendre les problèmes liés aux systèmes distribués.

## Confiance et défaillance

Dans l'approche par client / serveur, vous devez avoir confiance dans le serveur :

* Il ne va pas altérer les données : les perdre ou les corrompre.
* Il va être disponible pour vous répondre : accepter de vous répondre, être actif et ne pas subir une panne.

Vous devez avoir confiance dans le fait que l'individu ou l'entité qui opère le serveur respecte ces critères. Mais face à des enjeux économiques ou politiques importants, il se peut qu'on ne puisse pas faire confiance à une seule entité.

Pour résister aux pannes ou à une forte demande vous pouvez aussi avoir envie de mettre plusieurs serveurs, chacun pouvant absorber une partie de la charge.

La solution utilisée par la blockchain est la distribution. Il n'y a pas de serveur central, tout le monde peut se rajouter au réseau et assurer le rôle de serveur. C'est une base de données distribuées. Distribuer revient à avoir plusieurs serveurs qui se synchronisent entre eux. On ne parle plus de serveur dans ce cas mais de noeuds du réseau. Il n'y a plus besoin d'avoir confiance dans un unique individu mais il faut faire confiance à l'ensemble du système donc à de multiple individus.

#### Essayer de lancer plusieurs fois le serveur. Que ce passe-t'il ? Pourquoi ?

Mettre plusieurs noeuds sur une même machine n'est pas une idée de génie. En production, l'utilité est assez limitée mais en test ou en développement, c'est fort utile à moins de disposer de plusieurs machines.

Il faut pouvoir lancer le noeud plusieurs fois avec des configurations différentes.

#### Observer le code source de `db.js`. Lancez plusieurs noeuds en parallèle sans modifier le code source.

##### Indice : vous connaissez la différence entre '-' et '--' en Bash ?

Vous êtes maintenant en mesure de lancer plusieurs noeuds en parallèle mais ils ne se voient pas et ne se synchronisent pas.

## Jouer avec des inconnus

Il faut maintenant faire en sorte que nos noeuds se voient et se parlent. Pour cela, il faut savoir comment les contacter. Dans Bitcoin et dans un système distribué plus généralement, on peut ajouter un noeud à tout moment et sans le connaitre.

J'ai ajouté dans le *CLI* deux commandes : `addPeer` et `peers`.

La commande `addPeer` prend un port en paramètre. Ce port sera utiliser pour ajouter un nouveau voisin au noeud. Retourne `false` si le voisin existe déjà, sinon, retourne `true`.

La commande `peers` demande au noeuds de retourner la liste de ses voisins.

#### Déclarez un tableau `neighbors` contenant la liste des ports utilisés par les voisins.

```Javascript
const neighbors = [];
```

#### En vous inspirant des commandes déjà présentes dans le noeud, ajoutez dans `db.js` une commande `peers` qui retourne la liste des ports utilisés.

Pour vérifier que la commande fonctionne, vous pouvez initialer le tableau avec des valeurs : `const neighbors = ['a', 'b', 'c'];`.

#### Ajoutez une commande `addPeer` à votre noeud. Dans un premier temps, faites en sorte que cette commande ajoute le port à la liste des voisins.

```Javascript
const maVariable = 42;
myArray.push(maVariable);
// La fonction push ajoute 'maVariable' à la fin du tableau
```

#### Vérifiez le bon fonctionnement avec la commande `peers`.

Les deux commandes semblent fonctionner ? Parfait, le comportement actuel de `addPeers` correspond au fonctionnement d'une autre fonction : `auth`. `auth` permet à un serveur de s'identifier comme voisin à un autre serveur. Nous verrons plus tard son utilisation

#### Copier la version actuelle de  `addPeers` et renommer la copie `auth`.

Il faut maintenant que les noeuds communiquent entre eux.

Le code suivant permet de créer une nouvelle connexion vers un autre noeud.

```Javascript
const ioClient = require('socket.io-client');

const socket = ioClient(`http://localhost:${port}`, {
  path: '/byc'
});
```

Quand la connexion est établie, l'événement `connect` est émit. Vous pouvez observer le *CLI* pour avoir un exemple.

#### Modifiez la commande `addPeer` de votre noeud pour qu'elle crée une nouvelle connexion.

Est-ce que le noeud ajouté indique bien une nouvelle connexion ? Oui ? Cool ! Par contre, si vous faites un `peers` sur le noeud ajouté, il n'y a pas le noeud source dans la liste des voisins. On a une commande pour mettre à jour cette liste !

#### Modifiez la commande `addPeer` pour qu'elle envoie une commande `auth` après la connexion.

## Appariement et synchronisation

Nos noeuds maintenant échanger des informations. Vous allez essayer de mettre en place 3 noeuds qui communiquent entre eux et se synchronisent. Par exemple, supposons que vous utilisez les ports 3000, 3001 et 3002.

Si vous avez respecter les consignes jusqu'à maintenant, votre noeud est connecté aux autres. Il faut maintenant mettre à jour les autres quand lui-même est modifié.

Pour commencer, il faut stocker les sockets pour pouvoir écrire à nos contacts.

#### Déclarer un tableau `sockets` qui contiendra la liste des sockets du noeuds.

#### Modifiez la commande `addPeer` pour qu'elle stocke la socket dans le tableau `sockets`.

#### Modifiez la commande `auth` pour qu'elle stocke la socket dans le tableau `sockets`.

N'oubliez pas d'appliquer la fonction `initSocket` aux sockets que vous créez dans `addPeer`. De préférence après qu'elles soient connectées.

#### Modifiez la méthode `set` pour qu'elle mette à jour les autres pairs.

##### Indice 1 :
```Javascript
// Un tableau remplit de choses
const monTableau = ['a', 'b', 'c', 'd'];
monTableau.forEach((element, index) => {
    // Je peux faire quelque-chose pour chaque élément.
    console.log("L'élément à l'index", index, "du tableau est", element);
});
```

##### Indice 2 : Vous pouvez voir comment envoyer une commande `set` dans `cli.js`.

#### Utilisez le *CLI* pour vérifier que tous les noeuds sont dans le même état. Si vous ne voyez pas comment, regardez le code source.

##### Indice : Vous avez fait un copier / coller brutal de la commande `set` du *CLI* avouez ? Et ça marche pour la première valeur ! Par contre, si vous essayez avec une seconde valeur, ça ne fonctionne plus. Est-ce que ça a du sens de fermer la socket entre deux noeuds ?

Vous avez réussi ? `set` une valeur sur un des noeuds met automatiquement à jour les autres ? Cool !

Imaginez trois amis qui essayent de maintenir une connaissance commune du statut relationnel de leurs connaissances. Réfléchissez maintenant à tous les problèmes qui peuvent arriver. Que se passe-t'il si un des amis est malade ou n'a plus de connexion réseau ? Si deux amis reçoivent en même temps des informations différentes pour une même personne ? Combien de temps avant de se synchroniser ?

Nous verrons comment résoudre ces difficultés à l'étape suivant.

## Synchronisation initiale

Lancer deux noeuds et connectez les. Ajouter quelles valeurs. Lancez maintenant un troisième noeud et connectez le aux deux autres.

#### Demander au troisième noeud une valeur définie avant son lancement. Quel est le problème ?

# Modifier la commande `auth` et `addPeer` pour qu'à chaque nouvelle connexion entre serveur, une requête `keys` soit envoyée et les couples clé / valeur inconnues ajoutées.

## Réseauter

Construire le réseau de noeuds est pénible ? J'ai un outil pour vous !

Vous avez pu remarquer un dossier `tools` et un `tools.js` apparaitre à cette étape. Il va nous aider :

```Bash
# Lance une clique de trois serveurs
./tools.js run

# Lance un anneau de 5 serveurs
./tools.js run "a-b, b-c, c-d, d-e, e-a"

# Lance une étoile de 6 serveurs avec a au milieu
./tools.js run "a-b, a-c, a-d, a-e, a-f"

# Vous pouvez être plus inventif sur les noms
./tools.js run "bob-alice, R2D2-C3PO, C3PO-BB8, 42-1337"
```

Les logs et les erreurs sont redirigés dans des fichiers de la forme `id.log` et `id.err` du dossier `logs`. Vous pouvez les afficher en temps réel avec `tail -f logs/id.log`.

## Conclusion

Nous avons un système qui marche plus ou moins, dans lequel n'importe quel noeud peut se connecter et reconstruire la base de données. C'est un système distribué minimaliste mais il ne fonctionne que dans un monde idéal où il n'y a pas de pannes ni de personnes mal intentionnées.

## Suite

Aller à l'étape 2 : `git checkout etape-2`.

Pour continuer à lire le sujet :

* soit vous lisez le fichier `README.md` sur votre machine.
* soit sur GitHub, au-dessus de la liste des fichiers, vous pouvez cliquer sur `main` et sélectionner `etape-2`.

## Pour aller plus loin

Pour continuer cette étape, vous pouvez essayer de discuter avec vos camarades pour étendre le système entre plusieurs machines.

Vous pouvez mettre en place des backups sur disque de la base de données.

### Partager ses voisins (bonus)

Ajouter les voisins à chaque noeud et à chaque fois que vous relancez les noeud est assez pénible ? Dans un vrai système pair à pair, *peer to peer* en anglais, abrégé P2P, la liste des voisins est envoyée aux nouveaux qui peuvent alors s'y connecter tout seul.

#### Faites des commandes `peers` sur vos différents noeuds. Voyez-vous le problème ?

#### Implémentez une commande `auth` qui a en paramètre un port. Cette commande permet à un noeud de s'identifier auprès d'un autre et d'indiquer celui-ci dans la liste de ses voisins.

#### Vous pouvez aussi modifier le code pour que la synchronisation initiale ne se fasse qu'en cas d'appel à `auth`.

#### Ajoutez une option `auto-connect` en regardant comment fonctionne `version` pour vous connecter automatiquement aux voisins de vos nouveaux voisins.
