---
title: Fiche 7
description: API, navigation, carte OSM et recherche.
permalink: posts/{{ title | slug }}/index.html
date: 2026-04-03
tags:
---

# Objectifs de la fiche

| Identifiant | Objectif                              |
| ----------- | ------------------------------------- |
| F10         | Consommation d'une API REST           |
| F11         | Navigation avec go_router             |
| F12         | Intégration d'une carte OpenStreetMap |
| F13         | Recherche et filtrage de données      |

Cette fiche a pour objectif de construire une application Flutter qui affiche les fresques BD de Bruxelles à partir d'une API publique. L'application proposera une vue liste, une vue carte, une page détail et une recherche.

# Concepts

## Introduction

Pour commencer, créez un nouveau projet Flutter nommé `tuto7` dans votre repository de cours.

Nous allons développer une application qui utilise l'API suivante :

[https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/bruxelles_parcours_bd/records?limit=100](https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/bruxelles_parcours_bd/records?limit=100)

Cette API renvoie une liste de fresques BD situées à Bruxelles. Chaque élément contient notamment :

- le nom de la fresque
- l'auteur
- l'adresse
- l'année
- la maison d'édition
- l'image
- la position géographique

Nous allons utiliser trois packages externes :

- `http` pour faire des requêtes HTTP
- `go_router` pour gérer la navigation
- `flutter_osm_plugin` pour afficher une carte OpenStreetMap

Vous pouvez les installer avec les commandes suivantes :

```bash
flutter pub add http
flutter pub add go_router
flutter pub add flutter_osm_plugin
```

Nous organiserons le projet de la manière suivante :

- un dossier `models` pour les données
- un dossier `views` pour les écrans
- un `main.dart` limité au démarrage de l'application et au routeur

## Appel API et affichage d'une liste

La première étape consiste à récupérer les données depuis l'API et à les afficher dans une liste.

Créez un fichier `freque.dart` dans le dossier `lib/models`.

```dart
import 'dart:convert';

import 'package:http/http.dart' as http;

const String fresquesApiUrl =
    'https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/bruxelles_parcours_bd/records?limit=100';

class Fresque {
  const Fresque({
    required this.name,
    required this.artist,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.year,
    required this.publisher,
    required this.surfaceM2,
    required this.comicRouteLink,
    required this.imageUrl,
  });

  final String name;
  final String artist;
  final String address;
  final double latitude;
  final double longitude;
  final String year;
  final String publisher;
  final String surfaceM2;
  final String comicRouteLink;
  final String imageUrl;

  factory Fresque.fromJson(Map<String, dynamic> json) {
    final geo = json['geo_point'] as Map<String, dynamic>;

    return Fresque(
      name: (json['nom_de_la_fresque'] as String?) ?? 'Fresque inconnue',
      artist: (json['dessinateur'] as String?) ?? 'Auteur inconnu',
      address: (json['adresse_fr'] as String?) ?? 'Adresse inconnue',
      latitude: (geo['lat'] as num).toDouble(),
      longitude: (geo['lon'] as num).toDouble(),
      year: (json['date'] as String?) ?? 'Année inconnue',
      publisher: (json['maison_d_edition'] as String?) ?? 'Éditeur inconnu',
      surfaceM2: ((json['surface_m2'] as num?) ?? 0).toString(),
      comicRouteLink: (json['lien_site_parcours_bd'] as String?) ?? '',
      imageUrl:
          ((json['image'] as Map<String, dynamic>?)?['url'] as String?) ?? '',
    );
  }
}

Future<List<Fresque>> fetchFresques() async {
  final response = await http.get(Uri.parse(fresquesApiUrl));

  if (response.statusCode != 200) {
    throw Exception('Échec du chargement des fresques.');
  }

  final decoded = jsonDecode(response.body) as Map<String, dynamic>;
  final results = decoded['results'] as List;

  final fresques = results
      .whereType<Map<String, dynamic>>()
      .map(Fresque.fromJson)
      .toList()
    ..sort((a, b) => a.name.compareTo(b.name));

  return fresques;
}
```

Cette classe représente une fresque et fournit une méthode `fetchFresques` qui récupère la liste depuis l'API.

Créez ensuite un écran `comic_map_view.dart` dans `lib/views` et commencez par une simple vue liste avec un `FutureBuilder`.

```dart
import 'package:flutter/material.dart';

import '../models/freque.dart';

class ComicMapPage extends StatelessWidget {
  const ComicMapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Carte des Fresques BD de Bruxelles')),
      body: FutureBuilder<List<Fresque>>(
        future: fetchFresques(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Erreur : ${snapshot.error}'));
          }

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final fresques = snapshot.data!;
          return ListView.separated(
            itemCount: fresques.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final fresque = fresques[index];
              return ListTile(
                title: Text(fresque.name),
                subtitle: Text('${fresque.artist} • ${fresque.address}'),
              );
            },
          );
        },
      ),
    );
  }
}
```

Cette première version permet déjà de :

- lancer la requête HTTP
- parser le JSON
- afficher une liste de fresques
- gérer les états chargement et erreur

> 

Commit : `T06.1 API et liste`

## Ajouter go_router et créer une page détail

Nous allons maintenant ajouter une vraie navigation entre une liste et une page détail.

Dans `main.dart`, configurez `go_router` :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'models/freque.dart';
import 'views/comic_map_view.dart';
import 'views/fresque_screen.dart';

void main() {
  runApp(const ComicMapApp());
}

class ComicMapApp extends StatelessWidget {
  const ComicMapApp({super.key});

  static final GoRouter _router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, state) => const ComicMapPage()),
      GoRoute(
        path: '/fresque',
        builder: (context, state) {
          final fresque = state.extra;
          if (fresque is! Fresque) {
            return const Scaffold(
              body: Center(child: Text('Aucune fresque sélectionnée.')),
            );
          }
          return FresqueScreen(fresque: fresque);
        },
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Carte des Fresques BD de Bruxelles',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0B5D7A)),
      ),
      routerConfig: _router,
    );
  }
}
```

Dans la liste, adaptez le `ListTile` pour naviguer vers la page détail :

```dart
onTap: () {
  context.push('/fresque', extra: fresque);
}
```

Créez alors un fichier `fresque_screen.dart` dans `lib/views`.

```dart
import 'package:flutter/material.dart';

import '../models/freque.dart';

class FresqueScreen extends StatelessWidget {
  const FresqueScreen({super.key, required this.fresque});

  final Fresque fresque;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Détails de la fresque')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(fresque.name, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(fresque.artist),
            Text(fresque.address),
            Text(fresque.year),
            Text(fresque.publisher),
          ],
        ),
      ),
    );
  }
}
```

La navigation est maintenant gérée proprement par `go_router`, et chaque fresque peut afficher une page dédiée.

> 

Commit : `T06.2 Navigation et détail`

## Améliorer la page détail avec image et mise en page

Une simple colonne de texte fonctionne, mais on peut améliorer le rendu visuel.

Dans notre version finale, la page détail utilise :

- l'image comme fond plein écran
- un dégradé sombre pour améliorer la lisibilité
- un titre plus grand
- l'auteur mis en valeur
- l'année et l'éditeur plus discrets
- l'adresse placée en bas à droite

Voici une version simplifiée du principe :

```dart
return Scaffold(
  extendBodyBehindAppBar: true,
  appBar: AppBar(
    title: const Text('Détails de la fresque'),
    backgroundColor: Colors.transparent,
    foregroundColor: Colors.white,
    elevation: 0,
  ),
  body: Stack(
    children: [
      Positioned.fill(
        child: Image.network(
          fresque.imageUrl,
          fit: BoxFit.cover,
        ),
      ),
      Positioned.fill(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.25),
                Colors.black.withOpacity(0.80),
              ],
            ),
          ),
        ),
      ),
      SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Text(
                fresque.name,
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                fresque.artist,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${fresque.year} • ${fresque.publisher}',
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.bottomRight,
                child: Text(
                  fresque.address,
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    ],
  ),
);
```

Cette structure repose sur un `Stack`, ce qui est très pratique pour superposer une image, un dégradé et du texte.

> 

Commit : `T06.3 Amélioration page détail`

## Ajouter les packages pour la carte et afficher OpenStreetMap

Nous allons maintenant enrichir l'écran principal avec une carte.

Le package `flutter_osm_plugin` permet d'afficher une carte OpenStreetMap et d'y placer des marqueurs.

Dans le widget principal, créez un contrôleur de carte :

```dart
final MapController _mapController = MapController.withPosition(
  initPosition: GeoPoint(latitude: 50.8466, longitude: 4.3528),
);
```

Ensuite, ajoutez le widget `OSMFlutter` :

```dart
OSMFlutter(
  controller: _mapController,
  osmOption: OSMOption(
    zoomOption: const ZoomOption(
      initZoom: 13,
      minZoomLevel: 5,
      maxZoomLevel: 19,
    ),
  ),
  mapIsLoading: const Center(
    child: CircularProgressIndicator(),
  ),
)
```

La carte est maintenant visible, mais elle n'affiche encore aucun point.

> 

Commit : `T06.4 Carte OSM`

## Afficher les marqueurs et aller au détail en cliquant

Nous allons synchroniser les fresques récupérées depuis l'API avec les marqueurs de la carte.

L'idée est de :

- charger la liste des fresques
- transformer cette liste en `GeoPoint`
- injecter ces points dans la carte
- détecter le clic sur un point
- retrouver la fresque correspondante
- naviguer vers la page détail

Exemple simplifié de synchronisation :

```dart
Future<void> _syncMarkers(List<Fresque> fresques) async {
  final geoPoints = fresques
      .map((fresque) => GeoPoint(
            latitude: fresque.latitude,
            longitude: fresque.longitude,
          ))
      .toList();

  await _mapController.setStaticPosition(geoPoints, 'fresques');
  await _mapController.setMarkerOfStaticPoint(
    id: 'fresques',
    markerIcon: const MarkerIcon(
      icon: Icon(Icons.place, color: Color(0xFFD7263D), size: 36),
    ),
  );
}
```

Pour gérer le clic sur un marqueur :

```dart
onGeoPointClicked: (point) {
  final selected = _findFresqueNear(point);
  if (selected != null) {
    context.push('/fresque', extra: selected);
  }
}
```

Dans notre projet, la recherche de la bonne fresque se fait avec une petite tolérance sur latitude et longitude, afin de faire correspondre le point cliqué avec l'objet `Fresque`.

> 

Commit : `T06.5 Marqueurs et navigation carte`

## Ajouter la recherche

Dernière étape : permettre à l'utilisateur de rechercher une fresque par nom ou par auteur.

Il suffit d'ajouter une variable d'état :

```dart
String _query = '';
```

Puis un champ texte :

```dart
TextField(
  decoration: const InputDecoration(
    prefixIcon: Icon(Icons.search),
    hintText: 'Rechercher par fresque ou auteur',
    border: OutlineInputBorder(),
  ),
  onChanged: (value) {
    setState(() {
      _query = value;
    });
    _requestMarkerSync();
  },
)
```

Ensuite, ajoutez une méthode de filtrage :

```dart
List<Fresque> _filteredFresques(List<Fresque> base) {
  final query = _query.trim().toLowerCase();
  if (query.isEmpty) {
    return base;
  }

  return base.where((fresque) {
    return fresque.name.toLowerCase().contains(query) ||
        fresque.artist.toLowerCase().contains(query);
  }).toList();
}
```

Cette liste filtrée peut être utilisée :

- dans la vue liste
- pour recalculer les marqueurs visibles sur la carte

L'utilisateur obtient ainsi une recherche cohérente sur les deux vues.

> 

Commit : `T06.6 Recherche`

# Exercice

## Introduction

Veuillez créer une application Flutter présentant les fresques BD de Bruxelles en reprenant les concepts de cette fiche.

Votre application doit contenir au minimum :

- une récupération des données depuis l'API
- un modèle `Fresque`
- un écran principal avec une liste
- une navigation vers un écran détail
- une carte OpenStreetMap avec des marqueurs
- une recherche par nom ou par auteur

## Étapes demandées

1. Affichez d'abord les fresques sous forme de liste simple.
2. Ajoutez ensuite une navigation avec `go_router`.
3. Créez une page détail soignée.
4. Intégrez une carte OSM.
5. Affichez les marqueurs correspondant aux fresques.
6. Faites en sorte qu'un clic sur un marqueur ouvre la bonne fiche détail.
7. Ajoutez une recherche qui filtre à la fois la liste et la carte.

## Challenge optionnel

Si vous souhaitez aller plus loin, vous pouvez ajouter une ou plusieurs améliorations parmi les suivantes :

- ouvrir le lien `Parcours BD` dans le navigateur
- ajouter un bouton pour recentrer la carte sur Bruxelles
- afficher un compteur du nombre de fresques filtrées
- adapter l'affichage détail selon la taille de l'écran
- afficher une information supplémentaire sur la carte lors du survol ou du clic
