---
title: Fiche 8
description: Fichiers & Déploiement.
permalink: posts/{{ title | slug }}/index.html
date: '2025-04-21'
tags: [fiche, flutter]
---

# Objectifs de la fiche

| Identifiant | Objectif    |
| ----------- | ----------- |
| F14         | Fichiers    |
| F15         | Déploiement |

# Exercice

Si vous êtes à cette fiche, c’est que vous avez déjà acquis un bon niveau en Flutter. Félicitations pour tous vos efforts !

Pour cette dernière fiche, nous ne verrons pas les différents concepts à travers un tutoriel. À la place, vous devrez découvrir ces concepts par vous-même en réalisant directement un exercice. 

## Introduction

Veuillez créer un nouveau projet (New Flutter Project) nommé `ex8` dans votre repository de cours.

L'objectif de cet exercice sera de créer une application servant d'éditeur de texte. 

Cette application doit présenter deux écrans. L'écran d'accueil doit afficher un menu avec deux boutons : *Ouvrir un fichier existant* et *Créer un nouveau fichier texte*. 

Lorsque l'utilisateur appuie sur l'un de ces deux boutons, l'application navigue vers un deuxième écran affichant l'éditeur de texte. Cet écran affiche le titre du fichier et un champ de texte permettant de modifier son contenu. Un bouton dans la barre de navigation de cet écran permet de sauvegarder le fichier.

![](/images/fiche8/img1.png)

![](/images/fiche8/img2.png)

Commencez par créer la structure et l'affichage de l'application, sans pour le moment vous attaquer aux fichiers. Les boutons de menus dans l'écran d'accueil ne doivent que naviguer vers l'éditeur. Le nom du fichier est "fichier.txt" et son contenu est initialement vide. Le bouton de sauvegarde revient à l'écran précédent.

> Commit: `F14.1 Structure et Affichage`

## Sélectionner un fichier

Afin de sélectionner un fichier à ouvrir, nous allons utiliser le package [file_picker](https://pub.dev/packages/file_picker). Ajoutez cette librairie aux dépendances de votre application. Il n'y a pas de configuration à faire pour cette librairie, sauf sur macOS où il faut ajouter un *entitlement* spécifique. Lisez bien la documentation si vous souhaitez compiler pour cette plateforme.

Lorsque l'utilisateur sélectionne l'option *Ouvrir un fichier existant* dans le menu de la page d'accueil de votre application, vous devez appeler la fonction `pickFiles` de cette libraire. Cette fonction va afficher un dialogue natif de votre plateforme permettant de sélectionner un fichier. Utilisez l'option `withData` de cette fonction pour récupérer le contenu du fichier en plus de ses métadata. La fonction vous renvoie un objet de type `PlatformFile` que vous pouvez transmettre à l'écran d'éditeur de texte.

Sur les plateformes mobiles et desktops, cet objet `PlatformFile` permet d'accéder au chemin du fichier, ce qui permettrait de lire et le modifier avec la classe `File` de dart. Cependant, sur le web il n'est pas possible d'accéder de cette manière aux fichiers et la propriété `path` de `PlatformFile` ne mène à rien. C'est pourquoi il est plus pratique de récupérer les données du fichier avec l'option `withData` directement. La documentation indique que ce n'est pas possible sur macOS, mais cela semble bien fonctionner malgré tout.

![](/images/fiche8/img3.png)

Lorsque l'utilisateur sélectionne l'option *Créez un nouveau fichier texte*, vous pouvez continuer de ne rien faire d'autre que rediriger vers l'écran d'éditeur de texte. C'est cet écran qui va créer le fichier. Il ne faut alors pas donner de valeur pour le paramètre de type `PlatformFile`.

Sur l'écran d'éditeur de texte si un fichier a bien été fourni en argument, pré-remplissez le nom du fichier que vous pouvez récupérer avec la propriété `name` de la classe `PlateformFile`. Pour pré-remplir le contenu, vous devrez transformer la propriété `bytes` en string avec la fonction `utf8.decode` de la libraire `dart:convert`.

> Commit: `F14.2 Sélectionner un fichier`

## Sauvegarder un fichier

Pour sauvegarder un fichier, nous allons utiliser la fonction `saveFile` de la même libraire. Contrairement à ce que son nom pourrait laisser penser, cette fonctionne ne va pas directement sauvegarder/modifier un fichier existant sur la machine de l'utilisateur. Sur les plateformes mobiles et desktops, elle va ouvrir un dialogue permettant de créer un fichier avec le nom et à l'emplacement souhaité. Cela correspondrait plus à un comportement de "Save As" comparé à d'autres applications. Sur le web, cette fonction va lancer un téléchargement du fichier avec le nom donné selon le comportement par défaut du navigateur.

Faites appel à cette fonction en lui fournissant des valeurs pour les paramètres `fileName` et `bytes`. Pour le nom du fichier, vous pouvez lui refournir le nom du fichier ouvert si celui-ci existait déjà ou fournir à la place un nom par défaut comme "Nouveau fichier" si aucun fichier n'était ouvert. Pour les données, vous devrez transformer le contenu de string à `UInt8List` avec la fonction `utf8.encode` de la librairie `dart.convert`. 

![](/images/fiche8/img4.png)

Pour le web, il n'y a pas de dialogue permettant de choisir/modifier le nom du fichier à télécharger. Remplacez l'affichage du nom de fichier par un nouveau champ de texte dans le cas où l'application tourne sur une plateforme web.

> Commit: `F14.3 Sauvegarder un fichier`

## Build l'application

Les applications Flutter peuvent être compilées selon différents modes. Jusqu'ici, nous avons lancé les applications en mode debug. Nous allons maintenant créer une version release de l'application. Cela implique entre autre que le hot reload est désactivé, le debugger ne peut plus être attaché au processus et le code javascript est minifié. On peut reconnaître une app en mode release par la disparition du bandeau "Debug" dans la barre de navigation. Vous pouvez retrouver plus d'informations sur les différents modes de build des applications flutter à [ce lien](https://docs.flutter.dev/testing/build-modes). 

La compilation en mode release se fait via la commande `flutter build` suivi de la plateforme visée (sauf pour android où il faut utiliser `flutter build apk` plutôt). Il est possible que certaines actions supplémentaires soient nécessaires selon la plateforme, comme la création d'un *provisionning profile* sur XCode pour iOS. À la fin de cette commande, un fichier est créé dans le dossier build et son chemin complet est affiché dans la console. Pour windows par exemple, cela crée un fichier exécutable `.exe`. Pour android, cela crée un paquet d'application `.apk`. Pour le web, cela crée un dossier avec le code html/js/css de l'application transpilée.

Testez de build l'application pour différentes plateformes, et d'exécuter ces différentes versions release de votre application. Pour les plateformes desktop, il suffit de lancer les fichiers app ou exécutables. Pour le web, cela nécessite de lancer un petit serveur de fichiers statiques comme l'extension [*Live Server*](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) de Visual Studio Code. Pour les plateformes mobiles, c'est compliqué sur android où il faut y transférer le fichier apk et paramétrer le téléphone pour accepter d'exécuter les applications provenant de source non fiable, et extrêmement difficile sur iOS où il faut en plus renouveller un profile de développement toutes les semaines et payer les frais du programme de développeur d'Apple.

> Commit: `F15.1 Build`

## Déploiement

Les étapes permettant de déployer une app qui a été build sont très dépendantes de la plateforme. Vous pourrez trouver plus d'informations pour chaque plateforme sur le site de flutter ([android](https://docs.flutter.dev/deployment/android), [ios](https://docs.flutter.dev/deployment/ios), [macos](https://docs.flutter.dev/deployment/macos), [windows](https://docs.flutter.dev/deployment/windows), [linux](https://docs.flutter.dev/deployment/linux)). La plupart du temps, cela nécessite cependant de payer pour obtenir le droit de publier son application sur le store d'applications de la plateforme visée.

C'est par contre bien plus facile sur le web. Pour cette plateforme, il suffit d'envoyer les fichiers du dossier `build/web` sur n'importe quel provider de serveur web de fichiers statique. Par exemple, GitHub Pages fonctionne très bien pour les applications flutter et est pour le moment entièrement gratuit.

Vous allez maintenant déployer l'application flutter de la fiche que vous avez préféré sur GitHub Pages.
- Commencez par créer un nouveau repository GitHub vide en ligne. Choisissez un nom de repository reconnaissable, par exemple "flutter-fiche-8" si vous souhaitez déployer l'exercice de la fiche 8.
- Ouvrez un terminal dans votre dossier de projet flutter. Lancez la commande `flutter build web --base-href "/<nom-repository>/"` où `<nom-repository>` est le nom de repository que vous avez choisi à l'étape précédente. L'option `base-href` est nécessaire car GitHub Pages va créer héberger votre application à l'URL `https://<pseudo-github>.github.io/<nom-repository>`. Il faut donc expliquer à flutter que tous les liens de fichiers doivent commencer par ce préfixe pour qu'il puisse effectuer les bonnes requêtes au serveur de fichier de GitHub Pages.
- Ouvrez un nouveau terminal dans le dossier `build/web` créé, et envoyez les fichiers qui y sont présents sur ce repository GitHub.
- Ouvrez les settings de votre repository GitHub en ligne, allez à l'onglet "Pages" et dans la section "Branches" choisissez la branche main puis sauvegardez ces settings.
- GitHub va automatiquement créer un serveur web de fichiers statiques qui va délivrer les fichiers contenus sur votre repository, en le redéployant après chaque commit sur la branche main. Après quelques secondes, en rechargeant cette page GitHub devrait vous afficher l'URL de votre application déployée. 

> Commit `F15.2 Déploiement`