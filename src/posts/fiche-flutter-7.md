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

Ouvrez l'API dans votre browser et notez:

- La structure de la liste
- Ce que contient chaque objet
- Les noms et types des champs

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

Créez un fichier `fresque.dart` dans le dossier `lib/models`.

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

Créez ensuite un écran `home_screen.dart` dans `lib/views` et commencez par une simple vue liste avec un `FutureBuilder`.

```dart
import 'package:flutter/material.dart';

import '../models/fresque.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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

Assurez vous d'appeller la HomeScreen à partir du fichier main, lancez l'application pour vérifier que vous avez bien une liste de fresquess.

> 

Commit : `T06.1 API et liste`

## Ajouter go_router et créer une page détail

Nous allons maintenant ajouter une vraie navigation entre une liste et une page détail.

Dans `main.dart`, configurez `go_router` :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'models/fresque.dart';
import 'views/fresque_screen.dart';
import 'views/home_screen.dart';

void main() {
  runApp(const ComicMapApp());
}

class ComicMapApp extends StatelessWidget {
  const ComicMapApp({super.key});

  static final GoRouter _router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
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

import '../models/fresque.dart';

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

Notez les nouveaux éléments utilisés:

- LinearGradient permet de faire un dégradé de couleurs qui combiné à de l'opacité et a la superposition avec l'image donne cette impression
- Positioned.fill permet de positionner un éléments à l'aide de valeur top, right, left, bottom - ce qui devrait vous rappelez quelque chose


> 

Commit : `T06.3 Amélioration page détail`

## Basculer entre liste et carte : l'enum et le Switch

Notre application n'affiche pour l'instant qu'une liste. Nous allons préparer l'arrivée de la carte en ajoutant un moyen de basculer entre les deux vues.

### L'enum

Un `enum` (énumération) est un type qui définit un ensemble fixe de valeurs nommées. C'est utile pour représenter un état qui ne peut prendre qu'un nombre limité de valeurs bien définies — ici, soit on affiche la liste, soit on affiche la carte.

Ajoutez ceci en haut de `home_screen.dart`, avant la classe :

```dart
enum MainView { list, map }
```

Plutôt qu'un booléen `_showMap`, cette approche nomme clairement chaque état et permet de l'utiliser partout dans le code de façon lisible.

### Convertir en StatefulWidget

Pour mémoriser l'état de la vue courante, `HomeScreen` doit devenir un `StatefulWidget`. Vous avez déjà effectué cette conversion dans une fiche précédente.

```dart
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  MainView _currentView = MainView.list;

  @override
  Widget build(BuildContext context) {
    // ...
  }
}
```

### Ajouter un Switch dans l'AppBar

Nous utilisons un `Switch` pour basculer entre les deux vues. Il prend un `bool` en entrée — nous le faisons correspondre à notre enum : `true` = carte, `false` = liste.

```dart
appBar: AppBar(
  title: const Text('Carte des Fresques BD de Bruxelles'),
  actions: [
    Row(
      children: [
        const Icon(Icons.view_list_outlined),
        Switch(
          value: _currentView == MainView.map,
          onChanged: (value) {
            setState(() {
              _currentView = value ? MainView.map : MainView.list;
            });
          },
        ),
        const Icon(Icons.map_outlined),
        const SizedBox(width: 8),
      ],
    ),
  ],
),
```

### Adapter le body

Dans le `FutureBuilder`, utilisez `_currentView` pour décider quoi afficher. La vue carte sera un simple placeholder pour l'instant :

```dart
final fresques = snapshot.data!;

if (_currentView == MainView.map) {
  return const Center(child: Text('Carte à venir...'));
}

return ListView.separated(
  // ... (code inchangé)
);
```

Lancez l'application et vérifiez que le Switch bascule bien entre la liste et le placeholder.

> 

Commit : `T06.4 Enum et Switch`

## Extraire les widgets ComicList et ComicMap

Notre `HomeScreen` va bientôt devenir complexe. C'est le bon moment pour extraire la liste et la carte dans leurs propres widgets, dans des fichiers séparés. Le widget principal restera responsable de l'état et de la logique ; les sous-widgets s'occupent uniquement de l'affichage.

Créez un fichier `lib/views/comic_list.dart` :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/fresque.dart';

class ComicList extends StatelessWidget {
  const ComicList({super.key, required this.fresques});

  final List<Fresque> fresques;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: fresques.length,
      separatorBuilder: (context, index) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final fresque = fresques[index];
        return ListTile(
          title: Text(fresque.name),
          subtitle: Text('${fresque.artist} • ${fresque.address}'),
          trailing: const Icon(Icons.chevron_right, size: 20),
          onTap: () {
            context.push('/fresque', extra: fresque);
          },
        );
      },
    );
  }
}
```

Créez ensuite un fichier `lib/views/comic_map.dart` :

```dart
import 'package:flutter/material.dart';

import '../models/fresque.dart';

class ComicMap extends StatelessWidget {
  const ComicMap({super.key, required this.fresques});

  final List<Fresque> fresques;

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Carte à venir...'));
  }
}
```

Dans `home_screen.dart`, remplacez les deux blocs inline par les nouveaux widgets, et ajoutez les imports correspondants :

```dart
import 'comic_list.dart';
import 'comic_map.dart';
```

```dart
if (_currentView == MainView.map) {
  return ComicMap(fresques: fresques);
}
return ComicList(fresques: fresques);
```

L'application doit se comporter exactement comme avant. Vérifiez-le, puis commitez : c'est un refactoring pur.

> 

Commit : `T06.5 Extraction des widgets`

## Ajouter les packages pour la carte et afficher OpenStreetMap

Nous allons maintenant remplacer le placeholder de `ComicMap` par une vraie carte.

Le package `flutter_osm_plugin` permet d'afficher une carte OpenStreetMap et d'y placer des marqueurs.

Commencez par convertir `ComicMap` en `StatefulWidget` — la carte a besoin d'un contrôleur qui doit rester en vie entre les rebuilds. Dans le state, déclarez le contrôleur :

```dart
final MapController _mapController = MapController.withPosition(
  initPosition: GeoPoint(latitude: 50.8466, longitude: 4.3528),
);
```

N'oubliez pas de le libérer dans `dispose` :

```dart
@override
void dispose() {
  _mapController.dispose();
  super.dispose();
}
```

Dans la méthode `build` de `_ComicMapState`, remplacez le `Center` placeholder par le widget `OSMFlutter` :

```dart
@override
Widget build(BuildContext context) {
  return OSMFlutter(
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
  );
}
```

La carte est maintenant visible, mais elle n'affiche encore aucun point.

> 

Commit : `T06.6 Carte OSM`

## Afficher les marqueurs et naviguer vers le détail

Nous allons placer un marqueur pour chaque fresque et naviguer vers la page détail au clic.

### Placer les marqueurs au démarrage de la carte

`OSMFlutter` fournit un callback `onMapIsReady` appelé une fois que la carte native est prête. C'est le bon endroit pour injecter les marqueurs.

Dans `_ComicMapState`, ajoutez la méthode suivante :

```dart
Future<void> _onMapReady(bool isReady) async {
  if (!isReady) return;
  final geoPoints = widget.fresques
      .map((f) => GeoPoint(latitude: f.latitude, longitude: f.longitude))
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

Les deux appels sont `async` car ils communiquent avec la couche native. `setStaticPosition` enregistre les positions, `setMarkerOfStaticPoint` définit l'icône à utiliser.

Passez le callback à `OSMFlutter` :

```dart
OSMFlutter(
  controller: _mapController,
  onMapIsReady: _onMapReady,
  // ...
)
```

### Naviguer au clic sur un marqueur

`OSMFlutter` fournit un callback `onGeoPointClicked` qui reçoit le `GeoPoint` cliqué. Il faut retrouver la `Fresque` correspondante:

```dart
  Fresque? _findFresqueNear(GeoPoint point) {
    for (final fresque in widget.fresques) {
      if (fresque.latitude == point.latitude &&
          fresque.longitude == point.longitude) {
        return fresque;
      }
    }
    return null;
  }
```

Puis dans `OSMFlutter` :

```dart
onGeoPointClicked: (point) {
  final selected = _findFresqueNear(point);
  if (selected != null) {
    context.push('/fresque', extra: selected);
  }
},
```

### Garder la carte en vie avec IndexedStack

Avec un simple `if/else` dans `HomeScreen`, `ComicMap` serait détruit chaque fois que l'on bascule vers la liste — et la carte se rechargerait à chaque retour. Pour éviter cela, remplacez le `if/else` par un `IndexedStack` :

```dart
IndexedStack(
  index: _currentView == MainView.map ? 0 : 1,
  children: [
    ComicMap(fresques: fresques),
    ComicList(fresques: fresques),
  ],
),
```

`IndexedStack` garde tous ses enfants en vie et n'affiche que celui dont l'index correspond. La carte reste donc initialisée en arrière-plan pendant que l'on consulte la liste.

> 

Commit : `T06.7 Marqueurs et navigation carte`

## Ajouter une mini-carte sur la page détail

Pour donner à l’utilisateur un repère géographique immédiat, nous allons afficher une petite carte dans le coin inférieur droit de `FresqueScreen`, juste en dessous de l’adresse.

### Convertir en StatefulWidget

`FresqueScreen` doit gérer le cycle de vie d’un `MapController`. Convertissez-le en `StatefulWidget`, initialisez le contrôleur dans `initState` centré sur la position de la fresque, et libérez-le dans `dispose` :

```dart
late final MapController _miniMapController;

@override
void initState() {
  super.initState();
  _miniMapController = MapController.withPosition(
    initPosition: GeoPoint(
      latitude: widget.fresque.latitude,
      longitude: widget.fresque.longitude,
    ),
  );
}

@override
void dispose() {
  _miniMapController.dispose();
  super.dispose();
}
```

### Placer le marqueur au démarrage

Même principe que pour `ComicMap` : utilisez `onMapIsReady` pour placer un marqueur unique à la position de la fresque.

```dart
Future<void> _onMiniMapReady(bool isReady) async {
  if (!isReady) return;
  await _miniMapController.setStaticPosition(
    [GeoPoint(latitude: widget.fresque.latitude, longitude: widget.fresque.longitude)],
    'location',
  );
  await _miniMapController.setMarkerOfStaticPoint(
    id: 'location',
    markerIcon: const MarkerIcon(
      icon: Icon(Icons.place, color: Color(0xFFD7263D), size: 24),
    ),
  );
}
```

### Intégrer la mini-carte dans le layout

Dans la ligne du bas, remplacez le `ConstrainedBox` de l’adresse par une `Column` qui empile l’adresse au-dessus de la mini-carte. `ClipRRect` arrondit les coins ; le zoom est fixé et bloqué min/max pour éviter que l’utilisateur ne dézoome :

```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.end,
  mainAxisSize: MainAxisSize.min,
  children: [
    ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 180),
      child: Text(widget.fresque.address, textAlign: TextAlign.right, /* ... */),
    ),
    const SizedBox(height: 8),
    ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 160,
        height: 120,
        child: OSMFlutter(
          controller: _miniMapController,
          osmOption: OSMOption(
            showZoomController: false,
            zoomOption: const ZoomOption(
              initZoom: 16,
              minZoomLevel: 16,
              maxZoomLevel: 16,
            ),
          ),
          onMapIsReady: _onMiniMapReady,
        ),
      ),
    ),
  ],
),
```

> 

Commit : `T06.8 Mini-carte sur le détail`

## J’y vais — localisation et fresque la plus proche

Nous allons ajouter un bouton « J’y vais » dans l’AppBar. Il localise l’utilisateur, trouve la fresque la plus proche, et ouvre sa page détail avec la distance affichée. La position est également marquée sur la carte principale.

### Les permissions de localisation

Accéder à la position GPS nécessite une autorisation explicite de l’utilisateur — c’est une règle de sécurité commune à toutes les plateformes. Sur le web, le navigateur affiche une popup de confirmation dès que l’application demande la localisation. Sur mobile, cette demande est gérée par le système d’exploitation.

Le package `geolocator` (déjà ajouté au projet) expose une API unifiée pour vérifier et demander cette permission avant d’accéder aux coordonnées.

### Demander la permission et obtenir la position

Dans `HomeScreen`, ajoutez un état pour la position de l’utilisateur et un état de chargement :

```dart
GeoPoint? _userLocation;
bool _isLocating = false;
```

La méthode `_onJyVais` gère le flux complet — permission, position, fresque la plus proche, navigation :

```dart
Future<void> _onJyVais() async {
  if (_isLocating || _fresques.isEmpty) return;
  setState(() => _isLocating = true);
  try {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Localisation refusée.')),
        );
      }
      return;
    }

    final position = await Geolocator.getCurrentPosition();
    final nearest = _nearestFresque(position);
    if (nearest == null || !mounted) return;

    final distM = Geolocator.distanceBetween(
      position.latitude, position.longitude,
      nearest.latitude, nearest.longitude,
    );

    setState(() {
      _userLocation = GeoPoint(latitude: position.latitude, longitude: position.longitude);
    });

    context.push('/fresque', extra: (fresque: nearest, distanceM: distM));
  } finally {
    if (mounted) setState(() => _isLocating = false);
  }
}
```

On vérifie d’abord la permission existante avant d’en demander une nouvelle — sur le web, `requestPermission` déclenche la popup du navigateur. Si l’utilisateur refuse, on affiche un `SnackBar`. `distanceBetween` renvoie la distance en mètres entre deux paires de coordonnées.

### Trouver la fresque la plus proche

```dart
Fresque? _nearestFresque(Position position) {
  Fresque? nearest;
  double minDist = double.infinity;
  for (final fresque in _fresques) {
    final d = Geolocator.distanceBetween(
      position.latitude, position.longitude,
      fresque.latitude, fresque.longitude,
    );
    if (d < minDist) {
      minDist = d;
      nearest = fresque;
    }
  }
  return nearest;
}
```

Pour que `_fresques` soit disponible ici, il faut le stocker en état dans `HomeScreen` (comme dans la version initiale avec `initState`) :

```dart
List<Fresque> _fresques = const [];

@override
void initState() {
  super.initState();
  _fresquesFuture = fetchFresques().then((fresques) {
    if (mounted) setState(() => _fresques = fresques);
    return fresques;
  });
}
```

### Ajouter le bouton dans l’AppBar

```dart
IconButton(
  icon: _isLocating
      ? const SizedBox(
          width: 20, height: 20,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
        )
      : const Icon(Icons.near_me),
  tooltip: "J'y vais",
  onPressed: _isLocating ? null : _onJyVais,
),
```

Le spinner remplace l’icône pendant la requête GPS pour indiquer que quelque chose est en cours.

### Afficher la distance sur la page détail

Dans `FresqueScreen`, ajoutez un paramètre optionnel `distanceM` et une méthode de formatage :

```dart
final double? distanceM;

String _formatDistance(double distM) {
  if (distM < 1000) return '${distM.round()} m';
  return '${(distM / 1000).toStringAsFixed(1)} km';
}
```

Affichez-la dans la colonne de gauche, sous la surface :

```dart
if (widget.distanceM != null) ...[
  const SizedBox(height: 4),
  Text(
    'À ${_formatDistance(widget.distanceM!)}',
    style: textTheme.bodySmall?.copyWith(
      color: Colors.white,
      fontWeight: FontWeight.w600,
    ),
  ),
],
```

### Mettre à jour le routeur

Le routeur doit maintenant accepter deux types d’`extra` : une simple `Fresque` (depuis la liste) ou un record contenant la fresque et la distance (depuis le bouton) :

```dart
GoRoute(
  path: '/fresque',
  builder: (context, state) {
    final extra = state.extra;
    if (extra is ({Fresque fresque, double distanceM})) {
      return FresqueScreen(fresque: extra.fresque, distanceM: extra.distanceM);
    }
    if (extra is Fresque) {
      return FresqueScreen(fresque: extra);
    }
    return const Scaffold(
      body: Center(child: Text('Aucune fresque sélectionnée.')),
    );
  },
),
```

Les records Dart (syntaxe `({Type champ, ...})`) permettent de passer plusieurs valeurs typées sans créer une classe dédiée.

### Afficher la position sur la carte

Passez `_userLocation` à `ComicMap` :

```dart
ComicMap(fresques: fresques, userLocation: _userLocation),
```

Dans `ComicMap`, ajoutez le paramètre et gérez le marqueur via `_placeUserMarker`, appelée depuis `_onMapReady` (si déjà disponible) et depuis `didUpdateWidget` (quand la valeur change après coup) :

```dart
Future<void> _placeUserMarker(GeoPoint location) async {
  if (_userMarkerPoint != null) {
    await _mapController.removeMarker(_userMarkerPoint!);
  }
  _userMarkerPoint = location;
  await _mapController.addMarker(
    location,
    markerIcon: const MarkerIcon(
      icon: Icon(Icons.my_location, color: Colors.blue, size: 28),
    ),
  );
}
```

`removeMarker` supprime le marqueur précédent si l’utilisateur appuie à nouveau sur le bouton. `addMarker` place un marqueur dynamique (contrairement à `setStaticPosition` qui gère des groupes).

> 

Commit : `T06.9 J’y vais`

# Exercice


