# Todolist

Projet Todolist en Node JS
Sybille Micallef
Liza Boumali

## Installation

Clonez l'application dans le dossier de votre choix:

```shell
git clone 
```

Déplacez vous dans le dossier créez et lancez la commande:
```shell
yarn install / npm install / ou grâce à la formule Brew pour MacOS
```

## Lancement

Dans un autre terminal, lancez mongo:


Dans le dossier de votre app, lancez-là:

```shell
yarn start / npm start #N'oubliez pas de faire un stop à la fin
```

## Technologies utilisées

### Node

- body-parser
- express
- express-flash
- express-session
- json2csv (pour le téléchargement en csv)
- mongoose
- nunjucks
- jsonwebtoken
- bcrypt
- mongoose-unique-validator

### Front

- Bootstrap 4
- sorttablejs (pour les tris)

## Fonctionnement

- Nous avons utilisé Bootsrap pour le front.
- On peut ajouter une taĉhe, la modifier et la supprimer. 
- On peut se connecter ou s'inscrire à l'application
- Les tâches ont un nom, une date de début, une date de fin, une priorité et un utilisateur.
- On marquer les tâches comme 'effectuées' et les modifier (les boutons à droite du tableau).
- Une fois une tâche marquée comme 'effectuée', elle est déplacé dans un tableau des tâches effectuées où on peut voir sa date de réalisation et la supprimer
- Les tâches peuvent êtres exportées en CSV.
- Un bouton est dispoble pour valider toutes les tâches d'un coup
- Un bouton est disponible pour supprimer toutes les tâches d'un coup (avec une confirmation avant).
- Un tri des tâches est disponible.
- Si un utilisateur est connecté, il ne verra que les tâches qui lui appartient
- Si une tâche à une priorité supérieure à 8, alors la ligne sera mise en avant.
