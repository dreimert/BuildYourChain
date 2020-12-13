# Build Your Chain

Le but de ce tutoriel est de coder une blockchain depuis un exemple simple de base de données pour en comprendre les mécanismes. Cette blockchain sera très loin d'une blockchain de production mais permettra d'illustrer les différentes mécaniques la constituant. Les notions et les problématiques seront introduites au fur et à mesure de la progression. Certaines seront *un peu* simplifiées.

Le code se fait en Javascript pour permettre au plus grand nombre de réaliser ce tutoriel et parce que c'est le langage de programmation que j'utilise quotidiennement :D. L'environnement utilisé pour l'écriture de ce sujet est Node.js (https://nodejs.org/fr/) en version 12 avec npm pour gérer les dépendances mais il doit fonctionner à partir de la version 10.

Ce tutoriel est la quatrième itération, vous pouvez trouver la troisième là : https://github.com/dreimert/BuildYourRating.

## Prérequis

Je pars du principe que vous savez coder en Javascript et utiliser git et github. Si ce n'est pas le cas, je vous invite pour le prochain TD à lire :

* Javascript :
  * https://eloquentjavascript.net/ (troisième édition en anglais)
  * https://fr.eloquentjavascript.net/ (première edition en français, anglais, allemand et polonais)
* Programmation événementielle en Javascript:
  * https://eloquentjavascript.net/11_async.html (Chapitre 11 de Eloquent JavaScript troisième édition)
  * http://www.fil.univ-lille1.fr/~routier/enseignement/licence/tw1/spoc/chap10-evenements-partie1.html (Vidéo / cours de Jean-Christophe Routier)
* Git : http://rogerdudler.github.io/git-guide/index.fr.html

## Installation classique de node

Vous êtes sur votre machine perso Covid oblige ? Tout se passe là : https://nodejs.org/

## Installation de node si vous êtes sur les postes de l'INSA

Télécharger les binaires et les décompresser :

    wget https://nodejs.org/dist/v12.14.1/node-v12.14.1-linux-x64.tar.xz
    tar -xJvf node-v12.14.1-linux-x64.tar.xz

Mettre à jour votre PATH :

    echo "export PATH=$PATH:$(pwd)/node-v12.14.1-linux-x64.tar.xz/bin/" >> ~/.bashrc

Recharger vos variables d'environnement :

    . ~/.bashrc

Vérifier que node s'exécute bien :

    node --version

## Cloner ce dépôt

```Bash
git clone https://github.com/dreimert/BuildYourChain
cd BuildYourChain
```

## Installer les dépendances

```Bash
npm install
```

## Objectif

Les buts de cette étape sont :

* Mettre en place l'environnement du tutoriel.
* Prise en main de l'environnement.
* Comprendre les bases de socket.io.
* Comprendre le fonctionnement d'une base de données minimaliste.

## Une base de données minimaliste

J'ai réalisé pour vous un serveur de base de données minimaliste. Pour l'exécuter, taper la commande : `node db.js`.

La base de données n'accepte que trois commandes : `get`, `set` et `keys` :

* get : permet de récupérer la valeur d'une clé. Si la clé n'existe pas, retourne `null`.
* set : permet d'associer une valeur à une clé. Si la clé n'existe pas, la valeur est affecté à la clé et la commande retourne `true`. Si la clé existe, elle n'est pas modifiée mais si la valeur est identique, la commande retourne `true` sinon la commande retourne `false` et un message d'erreur.
* keys : retourne la liste des clés de la base de données.

J'ai codé un *CLI* (Command Line Interface) pour passer des commandes à la DB. Pour voir les commandes que le *CLI* peut lancer : `node cli.js`.

Vous pouvez voir le code du serveur et du *CLI* dans les fichiers `db.js` et `cli.js`.

Le fichier de test `test.js` va nous permettre de tester notre base de données. Vous pouvez lancer les tests via la commande `npm test`. Ce fichier lance automatiquement le serveur de base de données et envoie les logs dans les fichiers `serveur.log` et `serveur.err`.

Vous ne devrez jamais modifier le ficher du *CLI* ou le fichier de tests. Ils seront mis à jour automatiquement au fur et à mesure de la progression.

#### Lancez les tests. Un test ne doit pas fonctionner. Corrigez la base de données pour que toutes les commandes fonctionnent et respectent le protocole.

## Socket.io

Pour gagner du temps, j'utilise *socket.io* qui me permet d'établir une connexion entre le serveur et le client. Vous pouvez trouver la documentation là : https://socket.io/.

Nous n'utiliseront pas beaucoup plus de fonctionnalités que celles utilisés dans l'exemple de la base de données. Il faut savoir envoyer et recevoir un message.

## Conclusion

Vous avez survécu ? Cool !

Quel est le rapport entre cette base de données et la blockchain ? La blockchain est une base de données avec les propriétés décrites. On ne peut pas mettre à jours les données ni en supprimer, on ne peut qu'en ajouter et lire le contenu.

Mais la blockchain est une base de données distribuées, ce qui n'est pas le cas de la notre qui raisonne en terme de client / serveur. On va essayer de corriger ça !

## Suite

Allez à l'étape 1 : `git checkout etape-1`.

Pour continuer à lire le sujet :

* soit vous lisez le fichier `README.md` sur votre machine.
* soit sur GitHub, au-dessus de la liste des fichiers, vous pouvez cliquer sur `Branch: master` et sélectionner `etape-1`.
