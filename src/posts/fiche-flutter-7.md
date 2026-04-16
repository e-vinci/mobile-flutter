---
title: Fiche 7
description: API, navigation, carte OSM et localisation.
permalink: posts/{{ title | slug }}/index.html
date: 2026-04-16
tags:
---

# Objectifs de la fiche

| Identifiant | Objectif                              |
| ----------- | ------------------------------------- |
| F12         | Intégration d'une carte OpenStreetMap |
| F13         | Localisation de l'utilisateur         |

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

Nous allons utiliser quatre packages externes :

- `http` pour faire des requêtes HTTP
- `go_router` pour gérer la navigation
- `flutter_osm_plugin` pour afficher une carte OpenStreetMap
- `geolocator` pour accéder à la localisation de l'utilisateur

Vous pouvez les installer avec les commandes suivantes :

```bash
flutter pub add http
flutter pub add go_router
flutter pub add flutter_osm_plugin
flutter pub add geolocator
```

Nous organiserons le projet de la manière suivante :

- un dossier `models` pour les données
- un dossier `views` pour les écrans
- un `main.dart` limité au démarrage de l'application et au routeur

## Appel API et affichage d'une liste

La première étape consiste à récupérer les données depuis l'API et à les afficher dans une liste.

Créez un fichier `mural.dart` dans le dossier `lib/models`.

```dart
import 'dart:convert';

import 'package:http/http.dart' as http;

const String muralsApiUrl =
    'https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/bruxelles_parcours_bd/records?limit=100';

class Mural {
  const Mural({
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

  factory Mural.fromJson(Map<String, dynamic> json) {
    final geo = json['geo_point'] as Map<String, dynamic>;

    return Mural(
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

Future<List<Mural>> fetchMurals() async {
  final response = await http.get(Uri.parse(muralsApiUrl));

  if (response.statusCode != 200) {
    throw Exception('Échec du chargement des fresques.');
  }

  final decoded = jsonDecode(response.body) as Map<String, dynamic>;
  final results = decoded['results'] as List;

  final murals =
      results.whereType<Map<String, dynamic>>().map(Mural.fromJson).toList()
        ..sort((a, b) => a.name.compareTo(b.name));

  return murals;
}
```

Cette classe représente une fresque murale et fournit une méthode `fetchMurals` qui récupère la liste depuis l'API.

Créez ensuite un écran `home_screen.dart` dans `lib/views` qui affiche une simple vue de liste de toutes les fresques murales récupérées avec un `FutureBuilder`.

```dart
import 'package:flutter/material.dart';

import '../models/mural.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fresques murales BD de Bruxelles')),
      body: FutureBuilder<List<Mural>>(
        future: fetchMurals(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Erreur : ${snapshot.error}'));
          }

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final murals = snapshot.data!;
          return ListView.separated(
            itemCount: murals.length,
            separatorBuilder: (context, index) => const Divider(),
            itemBuilder: (context, index) {
              final mural = murals[index];
              return ListTile(
                title: Text(mural.name),
                subtitle: Text('${mural.artist} • ${mural.address}'),
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

Assurez vous d'appeler la HomeScreen à partir du fichier main, lancez l'application pour vérifier que vous avez bien une liste de fresques.

> Commit : `T07.1 API et liste`

## Ajouter go_router et créer une page détail

Nous allons maintenant ajouter une vraie navigation entre une liste et une page détail.

Créez une page de détail `mural_screen.dart` dans `lib/views` :

```dart
import 'package:flutter/material.dart';

import '../models/mural.dart';

class MuralScreen extends StatelessWidget {
  const MuralScreen({super.key, required this.mural});

  final Mural mural;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Détails de la fresque')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(mural.name, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(mural.artist),
            Text(mural.address),
            Text(mural.year),
            Text(mural.publisher),
          ],
        ),
      ),
    );
  }
}
```

Modifiez le fichier `main.dart` pour configurer une configuration de routage avec `go_router` :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'models/mural.dart';
import 'views/home_screen.dart';
import 'views/mural_screen.dart';

void main() => runApp(const MuralMapApp());

final _router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'mural',
          builder: (context, state) {
            final mural = state.extra;
            if (mural is! Mural) {
              return Scaffold(
                appBar: AppBar(title: const Text('Détail de la fresque')),
                body: const Center(child: Text('Aucune fresque sélectionnée.')),
              );
            }
            return MuralScreen(mural: mural);
          },
        ),
      ],
    ),
  ],
);

class MuralMapApp extends StatelessWidget {
  const MuralMapApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Fresques murales BD de Bruxelles',
      theme: ThemeData(colorScheme: .fromSeed(seedColor: Colors.deepPurple)),
      routerConfig: _router,
    );
  }
}
```

Dans le HomeScreen, ajoutez ce paramètre au `ListTile` pour naviguer vers la page détail quand on clique dessus en passant la fresque sélectionnée en argument :

```dart
onTap: () => context.go('/mural', extra: mural)
```

La navigation est maintenant gérée proprement par `go_router`, et chaque fresque peut afficher une page dédiée.

> Commit : `T07.2 Navigation et détail`

## Améliorer la page détail avec image et mise en page

Dans la page de détail, une simple colonne de texte fonctionne, mais on peut améliorer le rendu visuel.

Dans notre version finale, la page détail utilise :

- l'image comme fond plein écran
- un dégradé sombre pour améliorer la lisibilité
- un titre plus grand
- l'auteur mis en valeur
- l'année et l'éditeur plus discrets
- l'adresse placée en bas à droite

Modifiez le `body` de `MuralScreen` pour obtenir ce résultat :

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
        child: Image.network(mural.imageUrl, fit: BoxFit.cover),
      ),
      Positioned.fill(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.25),
                Colors.black.withValues(alpha: 0.80),
              ],
            ),
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            const Spacer(), // Push content to the bottom
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mural.name,
                        style: Theme.of(context).textTheme.displaySmall
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        mural.artist,
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${mural.year} • ${mural.publisher}',
                        style: Theme.of(context).textTheme.bodyLarge
                            ?.copyWith(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      mural.address,
                      textAlign: TextAlign.right,
                      style: Theme.of(context).textTheme.bodyLarge
                          ?.copyWith(color: Colors.white70),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "no mini-map yet",
                      textAlign: TextAlign.right,
                      style: Theme.of(context).textTheme.bodyLarge
                          ?.copyWith(color: Colors.white30),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    ],
  ),
);
```

Cette structure repose sur un `Stack`, ce qui est très pratique pour superposer une image, un dégradé et du texte.

Notez les nouveaux éléments utilisés:

- extendBodyBehindAppBar permet d'étendre le body derrière l'appbar pour que l'image puisse occuper tout l'écran
- Positioned.fill permet de positionner un widget pour qu'il remplisse tout l'espace disponible dans le Stack
- LinearGradient permet de faire un dégradé de couleurs qui combiné à de l'opacité et a la superposition avec l'image donne cette impression
- crossAxisAlignment permettent d'aligner les éléments d'une colonne ou d'une ligne sur un côté spécifique
- Spacer est un widget invisible qui prend tout l'espace disponible, ce qui permet de pousser le contenu vers le bas
- copyWith sur les TextStyle permet de partir d'un style existant et de ne modifier que certains paramètres (ici la couleur et le poids de la police)

> Commit : `T07.3 Amélioration page détail`

## Basculer entre liste et carte : l'enum et le Switch

Pour l'instant, la page d'accueil de l'application n'affiche les fresques que sous forme de liste. Nous allons préparer l'arrivée de l'affichage des fresques sur une carte en ajoutant un moyen de basculer entre les deux vues.

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
  MainView _currentView = MainView.map;

  void changeView(bool switchToMap) =>
      setState(() => _currentView = switchToMap ? MainView.map : MainView.list);

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
  title: const Text('Fresques murales BD de Bruxelles'),
  actions: [
    Row(
      children: [
        const Icon(Icons.view_list_outlined), // Icon for list view
        Switch(
          value: _currentView == MainView.map,
          onChanged: changeView,
        ),
        const Icon(Icons.map_outlined), // Icon for map view
        const SizedBox(width: 8), // Spacing on the right of the switch
      ],
    ),
  ],
),
```

### Adapter le body

Dans le `FutureBuilder`, utilisez `_currentView` pour décider quoi afficher. La vue carte sera un simple placeholder pour l'instant :

```dart
final murals = snapshot.data!;

if (_currentView == MainView.map) {
  return const Center(child: Text('Carte à venir...'));
}

return ListView.separated(
  // ... (code inchangé)
);
```

Lancez l'application et vérifiez que le Switch bascule bien entre la liste et le placeholder.

> Commit : `T07.4 Enum et Switch`

## Extraire les widgets MuralList et MuralMap

Notre `HomeScreen` va bientôt devenir complexe. C'est le bon moment pour extraire la liste et la carte dans leurs propres widgets, dans des fichiers séparés. Le widget principal restera responsable de l'état et de la logique ; les sous-widgets s'occupent uniquement de l'affichage.

Créez un fichier `lib/views/mural_list.dart` :

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/mural.dart';

class MuralList extends StatelessWidget {
  const MuralList({super.key, required this.murals});

  final List<Mural> murals;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: murals.length,
      separatorBuilder: (context, index) => const Divider(),
      itemBuilder: (context, index) {
        final mural = murals[index];
        return ListTile(
          title: Text(mural.name),
          subtitle: Text('${mural.artist} • ${mural.address}'),
          onTap: () => context.go('/mural', extra: mural),
        );
      },
    );
  }
}
```

Créez ensuite un fichier `lib/views/mural_map.dart` :

```dart
import 'package:flutter/material.dart';

import '../models/mural.dart';

class MuralMap extends StatelessWidget {
  const MuralMap({super.key, required this.murals});

  final List<Mural> murals;

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Carte à venir...'));
  }
}
```

Dans `home_screen.dart`, remplacez les deux blocs inline par les nouveaux widgets, et ajoutez les imports correspondants :

```dart
import 'mural_list.dart';
import 'mural_map.dart';
```

```dart
switch (_currentView) {
  case MainView.list:
    return MuralList(murals: murals);
  case MainView.map:
    return MuralMap(murals: murals);
}
```

L'application doit se comporter exactement comme avant. Vérifiez-le, puis commitez : c'est un refactoring pur.

> Commit : `T07.5 Extraction des widgets`

## Ajouter les packages pour la carte et afficher OpenStreetMap

Nous allons maintenant remplacer le placeholder de `MuralMap` par une vraie carte.

Le package `flutter_osm_plugin` permet d'afficher une carte OpenStreetMap et d'y placer des marqueurs. Cette librairie ne fonctionne que sur mobile et en web, pas sur desktop. Si vous développez sur desktop, vous pouvez tester la carte en lançant l'application en mode web.

La carte a besoin d'un contrôleur qui doit rester en vie entre les rebuilds. Comme les contrôleurs de formulaires, les `MapController` doivent être libérés manuellement pour éviter les fuites de mémoire. 

Commencez par convertir `MuralMap` en `StatefulWidget`. Dans le state, déclarez le contrôleur :

```dart
final _mapController = MapController.withPosition(
  initPosition: GeoPoint(latitude: 50.8466, longitude: 4.3528),
);

@override
void dispose() {
  _mapController.dispose();
  super.dispose();
}
```

 Nous initialisons la carte centrée sur les coordonnées 50.8466, 4.3528. Il s'agit de la position centrale de Bruxelles, ce qui est un bon point de départ pour afficher les fresques.

Dans la méthode `build` de `_MuralMapState`, remplacez le `Center` placeholder par le widget `OSMFlutter` :

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

> Commit : `T07.6 Carte OSM`

## Afficher les marqueurs et naviguer vers le détail

Nous allons placer un marqueur pour chaque fresque et naviguer vers la page détail lorsque l'on clique sur un marqueur.

### Placer les marqueurs au démarrage de la carte

`OSMFlutter` fournit un callback `onMapIsReady` appelé une fois que la carte native est prête. C'est le bon endroit pour injecter les marqueurs.

Dans `_MuralMapState`, ajoutez la méthode suivante :

```dart
Future<void> _onMapReady(bool isReady) async {
  if (!isReady) return;
  final geoPoints = widget.murals.map((mural) {
    return GeoPoint(latitude: mural.latitude, longitude: mural.longitude);
  }).toList();
  for (final geoPoint in geoPoints) {
    await _mapController.addMarker(
      geoPoint,
      markerIcon: const MarkerIcon(
        iconWidget: SizedBox.square(
          dimension: 48,
          child: Icon(Icons.place, color: Colors.red, size: 48),
        ),
      ),
    );
  }
}
```

Cette méthode convertit la liste de fresques en une liste de `GeoPoint`, puis ajoute un marqueur pour chaque point sur la carte. Le marqueur utilise une icône simple fournie par Flutter.

Passez le callback à `OSMFlutter` :

```dart
OSMFlutter(
  controller: _mapController,
  onMapIsReady: _onMapReady,
  // ...
)
```

### Naviguer au clic sur un marqueur

`OSMFlutter` fournit un callback `onGeoPointClicked` qui reçoit le `GeoPoint` cliqué. Il faut retrouver la fresque correspondante:

```dart
void _onMarkerTap(GeoPoint point) {
  final mural = widget.murals.firstWhere(
    (mural) =>
        mural.latitude == point.latitude &&
        mural.longitude == point.longitude,
  );
  context.go('/mural', extra: mural);
}
```

Puis dans `OSMFlutter` :

```dart
OSMFlutter(
  controller: _mapController,
  onMapIsReady: _onMapReady,
  onGeoPointClicked: _onMarkerTap,
  // ...
)
```

### Garder la carte en vie avec IndexedStack

Avec un simple switch dans `HomeScreen`, la carte est détruite chaque fois que l'on bascule vers la liste et elle doit se recharger à chaque fois qu'on veut la réafficher. Pour éviter cela, remplacez le switch par un `IndexedStack` :

```dart
return IndexedStack(
  index: _currentView == MainView.map ? 1 : 0,
  children: [
    MuralList(murals: murals),
    MuralMap(murals: murals),
  ],
);
``` 

`IndexedStack` garde tous ses enfants en vie et n'affiche que celui dont l'index correspond. La carte reste donc initialisée en arrière-plan pendant que l'on consulte la liste.

> Commit : `T07.7 Marqueurs et navigation carte`

## Ajouter une mini-carte sur la page détail

Pour donner à l’utilisateur un repère géographique immédiat, nous allons afficher une petite carte dans le coin inférieur droit de `MuralScreen`, juste en dessous de l’adresse.

### Convertir en StatefulWidget

`MuralScreen` doit gérer le cycle de vie d’un `MapController`. Convertissez-le en `StatefulWidget`, initialisez le contrôleur dans `initState` centré sur la position de la fresque, et libérez-le dans `dispose` :

```dart
late final MapController _miniMapController;

@override
void initState() {
  super.initState();
  _miniMapController = MapController.withPosition(
    initPosition: GeoPoint(
      latitude: widget.mural.latitude,
      longitude: widget.mural.longitude,
    ),
  );
}

@override
void dispose() {
  _miniMapController.dispose();
  super.dispose();
}
```

Contrairement à la carte principale, la position de la mini-carte est centrée sur la fresque au lieu d'une localisation fixe dans Bruxelles. Puisque la fresque est un argument du widget, on y accède avec `widget.mural`, tel que vu précédemment. Seulement, cette information n’est pas directement disponible au moment de la création du widget, il faut donc attendre que le widget soit monté pour créer le contrôleur. C'est pourquoi on utilise `initState` plutôt que d'initialiser le contrôleur directement dans le corps de la classe `_MuralScreenState`. Le mot clé `late` indique que la variable sera initialisée plus tard, et garantit que nous ne tenterons pas d'accéder au contrôleur avant qu'il ne soit correctement créé.

### Placer le marqueur au démarrage

Même principe que pour `MuralMap`, on utilise `onMapIsReady` pour placer un marqueur. On affiche ici un marqueur unique à la position de la fresque.

```dart
Future<void> _onMiniMapReady(bool isReady) async {
  if (!isReady) return;
  await _miniMapController.addMarker(
    GeoPoint(
      latitude: widget.mural.latitude,
      longitude: widget.mural.longitude,
    ),
    markerIcon: const MarkerIcon(
      iconWidget: SizedBox.square(
        dimension: 48,
        child: Icon(Icons.place, color: Colors.red, size: 48),
      ),
    ),
  );
}
```

### Intégrer la mini-carte dans le layout

Remplacez le `Text` "no mini-map yet" par l'affichage de la mini-carte :

```dart
// au début de la méthode build, avant de retourner le Scaffold
final isWide = MediaQuery.sizeOf(context).width > 800;

// À la place du Text "no mini-map yet"
ClipRRect(
  borderRadius: BorderRadius.circular(10),
  child: SizedBox(
    width: isWide ? 300 : 150,
    height: isWide ? 160 : 120,
    child: OSMFlutter(
      controller: _miniMapController,
      onMapIsReady: _onMiniMapReady,
      osmOption: OSMOption(
        showZoomController: false,
        zoomOption: const ZoomOption(
          initZoom: 16,
          minZoomLevel: 5,
          maxZoomLevel: 19,
        ),
      ),
    ),
  ),
),
```

Le widget est encapsulé dans un `ClipRRect` pour arrondir les coins, et sa taille s'adapte à la largeur de l'écran pour rester lisible sur mobile. La carte est centrée sur la fresque et le zoom est plus élevé initialement pour montrer clairement sa position.

> Commit : `T07.8 Mini-carte sur le détail`

## Localisation de l'utilisateur et distance

Nous allons maintenant utiliser le package `geolocator` pour accéder à la localisation de l'utilisateur. Lorsque l'utilisateur affiche la page de détail d'une fresque, il peut voir sa propre position sur la mini-carte, ainsi que la distance qui le sépare de la fresque.

### Les permissions de localisation

Afin de pouvoir accéder à la localisation de l'utilisateur, l'application doit d'abord obtenir les permissions nécessaires. Sur les plateformes mobiles, cela implique de demander explicitement à l'utilisateur l'autorisation d'accéder à sa position. Sur le web, le navigateur gère cette demande et affiche une popup de confirmation lorsque l'application tente d'accéder à la localisation. Le package `geolocator` fournit une API unifiée pour vérifier et demander ces permissions de manière transparente, quel que soit la plateforme.

Sur mobile, il est également nécessaire de configurer les permissions dans les fichiers de configuration de l'application pour que le système d'exploitation autorise l'accès à la localisation.

Pour android, ajoutez les permissions suivantes dans `android/app/src/main/AndroidManifest.xml` :
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Pour iOS, ajoutez les clés suivantes dans `ios/Runner/Info.plist` :
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Cette application utilise votre localisation pour calculer la distance avec les fresques.</string>
```

Finalement, modifiez le fichier `main.dart` pour demander la permission et obtenir la position de l'utilisateur au lancement de l'application. Stockez la position dans une variable globale pour pouvoir y accéder depuis les différentes pages :

```dart
Position? _userPosition;

Future<void> _locateUser() async {
  var permission = await Geolocator.checkPermission();

  // permission is not granted, request it
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }

  // permission is still not granted, or denied forever, we can't get location
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    return;
  }

  _userPosition = await Geolocator.getCurrentPosition();
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  _locateUser();
  runApp(const MuralMapApp());
}
```

Modifiez ensuite `MuralScreen` pour récupérer la position de l'utilisateur et calculer la distance entre celle-ci et la fresque, et l'afficher sous la surface :

```dart
class MuralScreen extends StatefulWidget {
  const MuralScreen({super.key, required this.mural, this.userPosition});

  final Mural mural;
  final Position? userPosition;

  @override
  State<MuralScreen> createState() => _MuralScreenState();
}

// à la fin de la méthode _onMiniMapReady, après avoir ajouté le marqueur de la fresque
final userPosition = widget.userPosition;
if (userPosition != null) {
  await _miniMapController.addMarker(
    GeoPoint(
      latitude: userPosition.latitude,
      longitude: userPosition.longitude,
    ),
    markerIcon: const MarkerIcon(
      iconWidget: SizedBox.square(
        dimension: 48,
        child: Icon(Icons.my_location, color: Colors.blue, size: 48),
      ),
    ),
  );
}

// au début de la méthode build, avant de retourner le Scaffold
double? distance;

var userPosition = widget.userPosition;
if (userPosition != null) {
  distance = Geolocator.distanceBetween(
    userPosition.latitude,
    userPosition.longitude,
    widget.mural.latitude,
    widget.mural.longitude,
  );
}

// en dessous du ClipRRect de la mini-carte
const SizedBox(height: 8),
Text(
  "Distance : ${distance != null ? '${distance.toStringAsFixed(2)} m' : '--- m'}",
  style: Theme.of(context).textTheme.bodyMedium
      ?.copyWith(color: Colors.white70),
),

// Dans main.dart, passez la position de l'utilisateur à la page de détail via le routeur :
return MuralScreen(mural: mural, userPosition: _userPosition);
```

Tout ceci va permettre d'afficher la distance entre l'utilisateur et la fresque sur la page de détail, ainsi que de montrer la position de l'utilisateur sur la mini-carte. Avec tout ceci, notre application est complète !

> Commit : `T07.9 Localisation utilisateur et distance`

# Exercice

Maintenant que les touristes peuvent facilement retrouver les fresques de bande dessinées, nous allons les aider à se déplacer de manière agréable dans la ville grâce aux itinéraires vélo.

Créez une nouvelle application flutter avec les fonctionalités suivantes:

- Affichage d'une carte en home screen reprenant les itinéraires vélo
- Chargement de ceux-ci depuis l'API ici: https://opendata.brussels.be/explore/dataset/itineraires-cyclables-regionaux-rbc/information/?disjunctive.icr&disjunctive.colour&disjunctive.balises&disjunctive.part&disjunctive.type&disjunctive.commune_gemeente&refine.colour=%23008C00&location=12,50.81364,4.25137&basemap=jawg.sunny
- Notez que les trajets ont tous une couleurs (codée en RGB), servez vous en pour les différencier.

Attention - les itinéraires ne sont pas des points mais des tracés - a nouveau regardez bien la structure de l'API - une carte est également disponible pour visualiser les données sur le site d'opendata.brussels.

- Afficher sur un clic le détail de l'itinéraire (une carte avec juste cet itinéraire là) et son numéro ICR


