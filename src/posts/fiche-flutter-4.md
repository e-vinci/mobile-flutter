---
title: Fiche 4
description: Navigation & Provider.
permalink: posts/{{ title | slug }}/index.html
date: '2025-03-10'
tags: [fiche, flutter]
---

# Objectifs de la fiche

| Identifiant | Objectif                     |
| ----------- | ---------------------------- |
| F06         | Navigation entre écrans      |
| F07         | Gestion d'état avec Provider |

# Concepts

Pour commencer le tutoriel, créez un nouveau projet flutter nommé `tuto4` dans votre repository de cours. 

## Navigation entre écrans

### Installation du package et mise en place des écrans

Il existe plusieurs façons de gérer un router et la navigation avec Flutter. Nous vous proposons ici la façon la plus moderne, qui offre un maximum de possibilités, en utilisant une navigation déclarative plutôt qu’impérative. Flutter offre le package *go_router* pour naviguer au sein d’une application. Veuillez installer la dépendance  avec la commande suivante :

```bash
flutter pub add go_router
```

Vous allez ensuite créer deux nouveaux écrans. Veuillez créer le fichier `first_screen.dart` avec le code suivant :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FirstScreen extends StatefulWidget {
  const FirstScreen({super.key});

  @override
  State<FirstScreen> createState() => _FirstScreenState();
}

class _FirstScreenState extends State<FirstScreen> {
  var nbClicks = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("First screen"),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Hello from first screen."),
            const SizedBox(height: 16),
            Text("There were $nbClicks clicks."),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => setState(() => nbClicks++),
              child: const Text("click me"),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {}, // navigate to second screen
              child: const Text("go to second screen"),
            ),
          ],
        ),
      ),
    );
  }
}
```

Veuillez également créer le fichier `second_screen.dart` avec le code suivant :

```dart
import 'package:flutter/material.dart';

class SecondScreen extends StatelessWidget {
  final int nbClicks;

  const SecondScreen({super.key, this.nbClicks = 0});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Second screen"),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Hello from second screen."),
            const SizedBox(height: 16),
            Text("There were $nbClicks clicks in first screen."),
          ],
        ),
      ),
    );
  }
}
```

### Configuration des routes

Nous allons ensuite faire en sorte de configurer deux routes à l’aide de `GoRouter`. Remplacez le code dans `main.dart` avec le code suivant :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'second_screen.dart';
import 'first_screen.dart';

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const FirstScreen(),
      routes: [
        GoRoute(
          path: 'second',
          builder: (context, state) => const SecondScreen(),
        ),
      ],
    ),
  ],
);

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: _router,
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
    );
  }
}
```

Observations :
- On passe la configuration du router à `MaterialApp.router` via l’argument `routerConfig`.
- La route initiale est */* et correspond au widget `FirstScreen`.
- La route */second* correspondant au widget `SecondScreen` est configurée comme enfant de la route */*. 
- Une route enfant permet d’afficher un écran au-dessus du précédent écran et offre directement un bouton de retour en arrière lorsque la route est utilisée !

Lancez l'application pour tester son comportement. L'application se lance sur l'écran lié à la route initiale. Il n'est pas encore possible de naviguer au deuxième écran, comme nous n'avons pas encore donné le comportement du bouton pour ce faire. 

### Navigation simple entre deux écrans

Nous allons maintenant voir comment naviguer vers le deuxième écran lorsqu’on clique sur le bouton _go to second screen_ à l’aide de la méthode `context.go()`. Veuillez mettre à jour le deuxième `ElevatedButton` de `first_screen.dart`. Il sera également nécessaire d'ajouter un import proposé par Android Studio.

```dart
ElevatedButton(
  onPressed: () => context.go("/second"),
  child: const Text("Go to second screen"),
),
```

Veuillez exécuter l’application pour voir que la navigation fonctionne, qu’il est possible de voyager vers le deuxième écran, ainsi que de revenir vers le premier écran à l’aide du bouton « back » automatiquement créé pour vous. Cependant, le deuxième écran ne récupère pas encore le nombre de clicks effectués dans le premier.

> Commit: `T04.1 Navigation simple`

### Passage d’information avec extra

Maintenant, nous allons voir comment passer une valeur d'un écran à l'autre, le compteur du nombre de click dans ce cas-ci. 

Modifiez une nouvelle fois le deuxième `ElevatedButton` de `first_screen.dart`.

```dart
ElevatedButton(
  onPressed: () => context.go("/second", extra: nbClicks),
  child: const Text("Go to second screen"),
),
```

La propriété `extra` permet de passer des données au changement de route. Pour récupérer ces données, il faut examiner l'état de la route. Dans `main.dart`, veuillez mettre à jour la route vers le deuxième écran.

```dart
GoRoute(
  path: 'second',
  builder: (context, state) {
    final nbClicks = (state.extra ?? 0) as int;
    return SecondScreen(nbClicks: nbClicks);
  },
),
```

Ici, nous retrouvons dans l’état de la route la variable `state.extra`. Le framework ne sait pas quel type de données nous souhaitons passer dans cette variable, elle est donc de type `Object?`. Dans le cas où la navigation vers cet écran ne se fait pas via le bouton définit ci-dessus, la variable n'est pas définie et a donc la valeur `null`. Nous pouvons donc prendre une valeur de 0 par défaut et cast le tout en entier pour récupérer finalement le nombre de clicks effectués.

> Commit: `T04.2 Navigation avec extra`

Il est également possible de récupérer les `extra` d'une route directement dans le widget appelé de la façon suivante. Nous recommandons cependant de passer plutôt les données en paramètre aux widgets pour améliorer la modularité du code.

```dart
final int nbClicks = (GoRouterState.of(context).extra  ?? 0) as int;
```

### Passage d’information avec des paramètres de chemin

Nous allons mettre à jour le premier écran afin d’afficher une liste de noms d'utilisateurs. Lorsqu’on clique sur un de ces utilisateurs, nous aimerions que cela appelle un écran pour afficher toutes les informations associées à l’utilisateur sélectionné.

Modifiez le premier écran de la façon suivante :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FirstScreen extends StatefulWidget {
  const FirstScreen({super.key});

  @override
  State<FirstScreen> createState() => _FirstScreenState();
}

class _FirstScreenState extends State<FirstScreen> {
  var nbClicks = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("First screen"),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Hello from first screen."),
            const SizedBox(height: 16),
            Text("There were $nbClicks clicks."),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => setState(() => nbClicks++),
              child: const Text("click me"),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => context.go("/second", extra: nbClicks),
              child: const Text("go to second screen"),
            ),
            const SizedBox(height: 32),
            const Expanded(child: UserListView()),
          ],
        ),
      ),
    );
  }
}

class UserListView extends StatelessWidget {
  static const usernames = ['mcCain123', 'greg123', 'sarah123'];

  const UserListView({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: usernames.length,
      itemBuilder: (context, index) {
        final username = usernames[index];
        return ListTile(
          title: Center(child: Text(username)),
          onTap: () => context.go('/users/$username'),
        );
      },
    );
  }
}
```

Lorsque l'on tape sur un nom d'utilisateur, l'application navigue vers sa page via la fonction `context.go('/users/$username')`.

Nous allons maintenant créer l’écran `UserScreen` qui permet d’afficher les données d’un utilisateur. Veuillez créer le fichier `user_screen.dart` avec le code suivant :

```dart
import 'package:flutter/material.dart';

class UserScreen extends StatelessWidget {
  final String username;

  const UserScreen({super.key, required this.username});

  @override
  Widget build(BuildContext context) {
    final Map<String, String> userData = getUserData(username);

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Details'),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Username: ${userData['username']}'),
            Text('First Name: ${userData['firstname']}'),
            Text('Last Name: ${userData['lastname']}'),
            Text('Email: ${userData['email']}'),
          ],
        ),
      ),
    );
  }
}

Map<String, String> getUserData(String username) {
  final List<Map<String, String>> userList = [
    {
      'username': 'mcCain123',
      'firstname': 'John',
      'lastname': 'McCain',
      'email': 'john.mccain@example.com',
    },
    {
      'username': 'greg123',
      'firstname': 'Greg',
      'lastname': 'Doe',
      'email': 'greg.doe@example.com',
    },
    {
      'username': 'sarah123',
      'firstname': 'Sarah',
      'lastname': 'Johnson',
      'email': 'sarah.johnson@example.com',
    },
  ];

  return userList.firstWhere((user) => user['username'] == username);
}
```

Nous devons maintenant rajouter une route au sein de `main.dart` afin d’appeler le composant `UserScreen` en récupérant la variable de chemin qui est passée lors de l’appel de `context.go('/users/$username')`. Modifiez la configuration du routeur dans `main.dart` de la façon suivante.

```dart
final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const FirstScreen(),
      routes: [
        GoRoute(
          path: 'second',
          builder: (context, state) {
            final int nbClicks = (state.extra ?? 0) as int;
            return SecondScreen(nbClicks: nbClicks);
          },
        ),
        GoRoute(
          path: 'users/:username',
          builder: (context, state) =>
              UserScreen(username: state.pathParameters['username'] ?? ''),
        ),
      ],
    ),
  ],
);
```

Nous avons rajouté une nouvelle route */users/:username*, enfant de la route initiale */*. Cette route permet de s'occuper de n'importe quel utilisateur. Elle récupère son nom d'utilisateur au sein des paramètres de chemin au moyen de `state.pathParameters`.

Lancez l'application et essayez de naviguer entre les différents écrans.

> Commit: `T04.3 Navigation avec path parameter`

### Chemins sur le web

Si vous exécutez l'application sur un navigateur web comme Google Chrome, vous pourrez observer que les chemins du site affichés ne correspondent pas exactement à ce qu'on attend. 

Par défaut, Flutter utilise la stratégie *hash fragment* pour afficher les chemins de ses différents écrans sur le web. Cela donne des URL encodées comme :
> flutterexample.dev/#/path/to/screen

Le plus souvent, nous souhaitons modifier directement le chemin du site pour représenter les différents écrans. Cela donne plutôt :
> flutterexample.dev/path/to/screen

Pour modifier le comportement par défaut de Flutter afin de modifier le chemin du site, il faut ajouter la dépendance `flutter_web_plugins` dans le fichier `pubspec.yaml` :

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_web_plugins:
    sdk: flutter
```

Modifiez ensuite la fonction `main` du fichier `main.dart` de la façon suivante et réglez l'import de la fonction :

```dart
void main() {
  usePathUrlStrategy();
  runApp(const MyApp());
}
```

Relancez l'application sur le web et vérifiez que les URL s'affichent comme attendu.

> Commit: `T04.4 URL avec chemin`

### En savoir plus

Si vous souhaitez en savoir plus sur Go Router, n’hésitez pas à consulter sa documentation officielle : [pub.dev/documentation/go_router](https://pub.dev/documentation/go_router/latest/)

Il existe d'autres manières de gérer la navigation en Flutter. Vous pouvez découvrir cela sur le site officiel : [docs.flutter.dev/ui/navigation](https://docs.flutter.dev/ui/navigation)

## Architecture MVVM

Avec des applications toujours plus complexes, il devient vite nécessaire de rajouter une structure au sein du code pour s’y retrouver entre les différents fichiers et bien séparer les responsabilités. Vous avez déjà vu différents modèles d’architectures dans différents cours tels que MVC, fat-model ou l’architecture trois-tiers. Dans le monde de l’informatique mobile et de Android, un modèle d’architecture très fréquemment utilisé est le modèle *MVVM*, pour *Model – View – View Model*.

-	La couche *Model* correspond comme dans beaucoup de modèles architecturaux à la définition des données. Comme dans l’architecture fat-model, nous pourrons également retrouver dans cette couche des responsabilités supplémentaires comme la sérialisation ou l’accès aux données.
-	La couche *View* correspond aux différents widgets qui vont composer nos écrans et leurs composants. Elle définit la structure et l’affichage de l’application. Pour bien séparer les responsabilités, nous allons déplacer la gestion de l’état de l’application vers la couche suivante.
-	La couche *View Model* correspond à la gestion de l’état partagé de l’application. C’est maintenant dans cette couche que nous allons enregistrer les variables d’état ainsi que les méthodes permettant leur modification. Les widgets n’ont alors plus qu’à faire s’inscrire aux view models et afficher l’application en fonction de leur état.

Dans le projet de ce tutoriel, nous n’avons pas de couche *Model* comme les données utilisées sont juste un simple entier. Nous n’avons pas encore de couche *View Model*, cela viendra dans la section suivante. Nous pouvons par contre regrouper les fichiers de notre couche *View*. Créez un dossier `views` et déplacez-y les fichiers contenant les écrans.

> Commit: `T04.5 Architecture MVVM`

## Package Provider

Dans le but de créer un view model en flutter, nous allons utiliser le package *Provider*. Afin de rajouter ce package à un projet flutter, il est nécessaire d’exécuter les commandes suivantes dans un terminal.

```bash
flutter pub add provider
flutter pub get
```

Veuillez lire l’article suivant sur la gestion de l’état avec ce package : [Simple app state management](https://docs.flutter.dev/development/data-and-backend/state-mgmt/simple)

Observations :
-	On définit un view model en créant une classe qui étend la classe `ChangeNotifier`. Il contient les variables d’état et les méthodes permettant de les modifier. 
-	Une bonne pratique est de garder les variables d’état privées, et de définir des getter permettant d’accéder à leur valeur mais de ne pas les modifier. Pour les variables d’état contenant des listes, la méthode getter renvoie un `UnmodifiableListView` avec la liste en argument. Cette classe permet de visualiser l’état de la liste encapsulée en implémentant l’interface `Iterable` elle aussi, mais elle ne permet pas de modifier. De cette façon, les widgets pourront récupérer l’état de la liste sans risquer de la modifier. Assurez-vous de bien comprendre la syntaxe pour créer des getter.
-	Au sein des méthodes de modification des variables d’état, on utilise la méthode `notifyListener` pour indiquer aux widgets qui utilisent le view model que l’état a changé et qu’ils doivent mettre à jour leur affichage.
-	Le widget `ChangeNotifierProvider` permet de rendre disponible un view model à tous les widgets enfants de celui-ci. On utilise le paramètre `create` pour indiquer comment créer le view model. Le widget se chargera de créer l’instance du view model et de la partager avec tous ses enfants qui la requièrent.
-	Pour accéder au view model dans un enfant d’un `ChangeNotifierProvider`, on utilise un widget `Consumer<MyViewModel>`. Il prend un argument `builder` avec une fonction dont le deuxième argument est l’instance du view model et qui renvoie le widget à afficher. Il est alors possible d’utiliser le view model pour accéder aux variables d’état et de faire appel à des méthodes de modification. Lorsque l’état du view model change, cette méthode `builder` est re-appelée pour mettre à jour l’affichage en fonction du nouvel état.
-	Lorsqu’on souhaite récupérer la valeur d’une variable d’état, ou faire appel à une méthode de modification, sans vouloir faire de rebuild en fonction de la modification de l’état, on peut utiliser la fonction `Provider.of<MyViewModel>(context, listen : false)` qui renvoie une instance du view model au sein d'un enfant d'un `ChangeNotifierProvider`.

### Création d'un view model

Créez un dossier `view_models` avec un fichier `click_view_model.dart` contenant le code suivant :

```dart
import 'package:flutter/material.dart';

class ClickViewModel extends ChangeNotifier {
  var _clicks = 0;

  int get clicks => _clicks;

  void increment() {
    _clicks++;
    notifyListeners();
  }
}
```

Ce view model contient une variable d’état entière `_clicks`, avec un getter `clicks` permettant d’y accéder et une méthode `increment` qui permet de l’incrémenter et de réafficher les widgets qui l’utilisent grâce à l’appel à la méthode `notifyListeners`.

### Utilisation d'un view model

Pour rendre disponible le view model au sein de l’application, il faut d’abord décider à quel niveau faire appel au `ChangeNotifierProvider`. Comme nous aurons besoin du view model au sein des deux premiers écrans, il faut rajouter le provider au-dessus du widget qui y fait appel – le `MaterialApp`. Nous pouvons le faire directement au sein de `runApp`. Modifiez le fichier `main.dart` de la façon suivante :

```dart
void main() {
  usePathUrlStrategy();
  runApp(ChangeNotifierProvider<ClickViewModel>(
    create: (context) => ClickViewModel(),
    child: const MyApp(),
  ));
}
```

Grâce à l’utilisation du view model, nous pouvons récupérer le nombre de clics au sein du router. Nous n’utiliserons donc plus la valeur `extra` du router pour initialiser `nbClicks`. Modifiez le fichier `main.dart` de la façon suivante pour initialiser `nbClicks`:

```dart
GoRoute(
  path: 'second',
  builder: (context, state) {
    final nbClicks =
        Provider.of<ClickViewModel>(context, listen: false).clicks;
    return SecondScreen(nbClicks: nbClicks);
  },
),
```

Dans ce cas, le deuxième écran est statique et le nombre de clicks ne risque pas de changer pendant son affichage. Il n'est donc pas nécessaire de pouvoir rebuild lorsque la valeur de la variable d'état change. Il n'est donc pas utile d'utiliser un widget `Consumer`, et nous pouvons accéder à la valeur de la variable d'état avec `Provider.of` à la place.

Au sein du premier écran, celui-ci peut devenir stateless grâce à l’utilisation d’un view model ! Nous allons faire appel à un `Consumer` pour assurer un rebuild de l’application à chaque fois que le nombre de clic est incrémenté. Modifiez le widget `FirstScreen` dans le fichier `first_screen.dart` de la façon suivante :

```dart
class FirstScreen extends StatelessWidget {
  const FirstScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("First screen"),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: Center(
        child: Consumer<ClickViewModel>(
          builder: (context, viewModel, child) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("Hello from first screen."),
              const SizedBox(height: 16),
              Text("There were ${viewModel.clicks} clicks."),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => viewModel.increment(),
                child: const Text("click me"),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => context.go("/second"),
                child: const Text("go to second screen"),
              ),
              const SizedBox(height: 32),
              const Expanded(child: UserListView()),
            ],
          ),
        ),
      ),
    );
  }
}
```

Nous avons enlevé la variable d'état du widget. Celui-ci accède désormais à la valeur avec `viewModel.clicks` et la modifie avec `viewModel.increment()`. Nous avons également enlevé le paramètre `extra` de `context.go` qui n'était plus nécessaire. Pour pouvoir accéder au `viewModel`, nous avons rajouté un widget `Consumer<ClickViewModel>`.

Relancez l'application. Tout devrait toujours fonctionner de la même façon !

> Commit: `T04.6 View model provider`

# Exercice

## Introduction

Veuillez créer un nouveau projet (New Flutter Project) nommé `ex4` dans votre repository de cours.

L’objectif de cet exercice est de créer une application de lecture et de création d’articles. Vous trouverez sur moodle 4 fichiers. Vous y trouverez une classe article avec quelques articles de test, ainsi que trois écrans. 

La classe `Article` définit les données de notre application. Elle s’insère dans la couche `models` de l’architecture *MVVM*.

L’écran d’accueil affiche une liste d’articles non lus. Un bouton dans la barre de titre permet d’afficher (ou de cacher) les articles lus dans la liste. Pour chaque article, un bouton permet de le marquer comme lu et un autre de le supprimer de la liste. En cliquant sur un article, l’application navigue vers l’écran d’affichage. Un floating action button permet de naviguer vers l’écran de création.

L’écran de création affiche un formulaire permettant d’entrer le titre, auteur et contenu d’un nouvel article. Un bouton dans la barre de titre permet d’annuler la création et de revenir à la page d’accueil. Le bouton de soumission du formulaire permet de créer l’article et faire un reset du formulaire.

L’écran d’affichage d’un article présente le titre, l’auteur et le contenu d’un article. Un bouton dans la barre de titre permet de revenir à la page d’accueil. Un floating action button permet de marquer l’article comme lu/non lu.

Tel que vous les avez reçus, les écrans ne font que l’affichage et aucun bouton ne fonctionne. Pour cet exercice, vous devrez suivre les TODO marqués pour leur rendre leurs fonctionnalités.

Copiez ces fichiers au sein de votre projet en respectant l’architecture *MVVM*.

## Navigation

Faites appel aux différents écrans au sein de votre application en implémentant une navigation, et suivez les TODO F06 pour ajouter les fonctionnalités de changement d’écrans.

Lancez l’application et vérifiez que vous pouvez passer d’un écran à l’autre.

L’écran à afficher initialement est le `ListScreen`. De là, vous pourrez passer vers le `FormScreen` ou le `ArticleScreen`.

> Commit: `F06.1 Navigation`

## View model & État partagé avec Provider

Créez un view model qui garde comme variable d’état une liste d’articles et un booléen indiquant s’il faut afficher les articles lus. Il doit être possible de :
- Récupérer un article par son `id` (à utiliser dans la route permettant d’afficher un article sur base du paramètre de chemin `id` au lieu d’utiliser le paramètre `extra`)
- Ajouter un article ou supprimer un article à la liste
- Marquer un article de la liste comme lu ou non lu 
- Indiquer s'il faut n'afficher que les articles lus ou tous les articles.

N’oubliez pas de respecter l’architecture MVVM et d’ajouter le package provider à votre projet.

Utilisez le view model que vous avez créé au sein de vos écrans, et suivez les TODO F07 pour ajouter les fonctionnalités liées à l’état de l’application.

Lancez l’application et vérifiez que vous pouvez modifier l’état de l’application.

> Commit: `F07.1 Etat partagé avec Provider`
