---
title: Fiche 6
description: Locale storage
permalink: posts/{{ title | slug }}/index.html
date: '2025-04-04'
tags: [fiche, flutter]
---

# Objectifs de la fiche

Nous avons vu comment gérer un état dans l'applicatin (setState, etc) - mais cet état n'est que transitoire (le temps que l'utilisateur utilise l'application).

Dans de nombreux cas nous souhaitons que l'état dure plus longtemps - typiquement entre deux sessions d'activités, que ce soit pour des préférences (langue, theme, etc) ou pour des données créees ou gérées par l'utilisateur.

Nous allons voir comment traiter ces deux scénarios à travers une application de prise de notes.

## Structure de l'application

Créez une nouvelle app flutter, et installez le package go_router comme précédemment.

```dart
final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const PostList(),
      routes: [
        GoRoute(
          path: 'new_post',
          builder: (context, state) => NewPost(),
        ),
        GoRoute(
          path: 'settings',
          builder: (context, state) => Settings(),
        )
      ]
    )
  ]
);
```

Créez déjà les écrans PostList, NewPost et Settings sous forme de Stateless Widget ("stless" pour les générer) dans un folder view avec pour chacun un composant Scaffold, un body avec un simple Text() avec le nom de la page et une AppBar permettant de naviguer:

```dart
AppBar(
    title: Text(title),
    backgroundColor: Colors.blue,
    actions: [
      IconButton(
        icon: const Icon(Icons.add),
        onPressed: () {
          context.go('/new_post');
        },
      ),
      IconButton(
        icon: const Icon(Icons.color_lens),
        onPressed: () {
          context.go('/settings');
        },
      ),
    ],
  );
```

Vérfiez que vous pouvez bien naviguer entre les différents écrans, et faite un premier commit:

> Commit: `T06.1 Structure de l'application`

Nous n'avons pas donné tous les détails ici, mais vous pouvez vous référer à la fiche 4 pour tout ce qui est routing.

## Theme et SharedPreferences




