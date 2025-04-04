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

Créez une nouvelle app flutter, et installez les package go_router et provider comme précédemment (`flutter pub add go_router`, `flutter pub add provider`).

```dart
final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => PostList(),
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

Configurez le router dans main.dart.

Créez déjà les écrans PostList, NewPost et Settings sous forme de Stateless Widget ("stless" pour les générer) dans un folder view avec pour chacun 

- un composant Scaffold
- un body avec un simple Text() avec le nom de la page 
- une AppBar permettant de naviguer:

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

Nous n'avons pas donné tous les détails ici, mais vous pouvez vous référer à la fiche 4 pour tout ce qui est routing - cela devrait commecer à être familier.

## Theme et SharedPreferences

Nous allons utiliser un premier package ici pour sauvegarder le theme - comme dans la fiche 3 notre utilisateur veut pouvoir configurer la couleur de l'application - et il ne veut pas devoir le refaire à chaque fois qu'il la réouvre.

Nous allons pour cela utiliser un package flutter nommé [shared preferences](https://pub.dev/packages/shared_preferences). Celui ci permet de stocker des élements simple de manière persistante. Flutter étant multi plateforme, ceci est implémenté différent sur chaque target:

| Platform | SharedPreferences                  | SharedPreferencesAsync/WithCache       |
|----------|------------------------------------|----------------------------------------|
| Android  | SharedPreferences                 | DataStore Preferences or SharedPreferences |
| iOS      | NSUserDefaults                    | NSUserDefaults                         |
| Linux    | In the XDG_DATA_HOME directory    | In the XDG_DATA_HOME directory         |
| macOS    | NSUserDefaults                    | NSUserDefaults                         |
| Web      | LocalStorage                      | LocalStorage                           |
| Windows  | In the roaming AppData directory  | In the roaming AppData directory       |

Installez le package avec `flutter pub add shared_preferences`.

L'api de SharedPreference est simple:

```dart
final prefs = await SharedPreferences.getInstance();
prefs.setString("key", my_string); 
var value = prefs.getString("key");
```

SharedPreference est limité à quatre types type et un type tableau:

- setString/getString
- setBool/getBool
- setInt/getInt
- setDouble/getDouble
- setStringList/getStringList

Le package est donc tout a fait adapté à ce que nous voulons faire ici - sauvegarder la couleur du thème (un simple String) - mais ne convient pas à des données plus complexes (nous allons voir une solution pour celle ci plus loin dans la fiche).

### ThemeService

Nous voulons éviter d'avoir des appels à SharedPreference partout dans l'application, donc nous allons créer un service pour isoler ceci. Créez une class ThemService dans un folder "services":

```dart
//theme_service.dart

import 'package:shared_preferences/shared_preferences.dart';

class ThemeService {
  Future<void> setMainColor(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("main_color", value);
  }

  Future<String> getMainColor() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString("main_color") ?? "red";
  }
}
```

### ThemeViewModel

Pour que tous les widgets aient accès à la "mainColor", nous allons comme précédemment utiliser un ViewModel:

```dart
import 'package:flutter/material.dart';
import 'package:tuto6stepbystep/models/theme_service.dart';

const COLORS = {
  "red": Colors.red,
  "purple": Colors.purple,
  "blue": Colors.blue,
  "green": Colors.green,
  "yellow": Colors.yellow,
};

class ThemeViewModel with ChangeNotifier {
  late ThemeService _themeService;

  String _mainColor = "red";

  String get mainColor => _mainColor;

  set mainColor(String color) {
    _mainColor = color;
    _themeService.setMainColor(color);
    notifyListeners();
  }

  MaterialColor get mainColorMaterial => COLORS[_mainColor] ?? Colors.red;

  void _init() async {
    var savedColor = await _themeService.getMainColor();
    _mainColor = savedColor != "" ? savedColor : "red";
    notifyListeners();
  }

  ThemeViewModel() {
    _themeService = ThemeService();
    _init();
  }

}
```

Celui-ci:

- Est initialisé avec la valeur stockée par ThemeService ou du rouge
- Se charge de notifier des changements ("notifyListeners")
- Est la seule classe qui va utiliser le ThemeService

Ceci est important car cela permet un découplage - si demain nous avons besoin d'un mécanisme plus flexible que les SharedPreference (par exemple pour stocker un theme complexe avec plusieurs couleurs, police ce caractère, language et autre - ou parce que l'on décide de stocker ces information dans une DB en ligne), seul ThemeViewModel devra être modifé - du point de vue du reste de l'application rien ne change.

Vu que les SharedPreferences ne sauvegardent que des types simple, on va garder comme référence ici juste le nome de la couleur. La map "COLORS" et le getter "get mainColorMaterial" permettent de récupérer directement un "MaterialColor" (qui est le type utilisé dans la plupart des widgets).

Pour pouvoir l'utiliser dans tous nos écrans nous allons déclarer un provider tout au dessus de l'application:

```dart
// main.dart
Widget build(BuildContext context) {
    return ChangeNotifierProvider<ThemeViewModel>(
      create: (context) => ThemeViewModel(),
      child:  // Use the provider to get the theme
        MaterialApp.router( //next lines as before
```

Avec ces différents éléments on peut déjà adapter chaque écran pour afficher les AppBar avec la couleur de fond définie dans le thème (par défaut rouge):

```dart
  @override
  Widget build(BuildContext context) {
    var model = Provider.of<ThemeViewModel>(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Settings'),
        backgroundColor: model.mainColor,
```

Faire ces opérations dans chaque écran est un peu fastidieux. Pour éviter ceci on peut extraire les AppBar dans un fichier distinct nav_bar.dart dans un nouveau dossier "widgets":

```dart
// widgets/nav_bar.dart
PreferredSizeWidget navBar(BuildContext context, String title) {
  final themeViewModel = Provider.of<ThemeViewModel>(context);
  return AppBar(
    title: Text(title),
    backgroundColor: themeViewModel.mainColor,
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
}
```

Lisez attentivement le fichier, puis essayez de remplacer la navbar de la PostList par celle-ci. 
Est ce que ce widget est une classe ? Sinon pourquoi ?

Utiliser dans PostList:

```dart

  //post_list.dart
  
  @override
  Widget build(BuildContext context) {
    var model = Provider.of<ThemeViewModel>(context);
    return Scaffold(
      appBar: navBar(context, 'Posts'),
      body: Center(
        child: Text('Post List'),
      ),
    );
  }
}
```

Regardez le type attendu pour "appBar" dans [Scaffold](https://api.flutter.dev/flutter/material/Scaffold/appBar.html).

Pour expliquer le tout:

- Nous voulons éviter de coder une AppBar identique (à l'exception du titre) dans chaque composant
- Nous devons respected l'API de Scaffold qui attend un widget de type "PreferredSize" dans le champs appBar
- Il nous serait possible de recoder une AppBar nous même (en étandant la classe PreferredSize)... mais c'est du travail inutile
- Plutôt que de "wrapper" un composant AppBar, nous avons simplement une méthode qui le créer (on appelle ca une "factory") et le renvoie

Le tout devrait tourner avec un background rouge.

> Commit: `T06.2 Shared Preferences`

### Mise à jour des préférences

Nous allons mettre à jour l'écran Settings pour permettre de sélectionner une nouvelle couleur.

Pour ceci nous allons créer un simple ColorPicker:

```dart
// widgets/color_picker.dart
import 'package:flutter/material.dart';
import 'package:tuto6stepbystep/models/theme_view_model.dart';

class ColorPicker extends StatelessWidget {
  final String selectedColor;
  final ValueChanged<String> onColorSelected;

  const ColorPicker({
    super.key,
    required this.selectedColor,
    required this.onColorSelected,
  });

  @override
  Widget build(BuildContext context) {
    final colors = ['red', 'green', 'blue', 'yellow', 'purple'];

    return Wrap(
      spacing: 8.0,
      children: colors.map((possibleColor) {
        return ChoiceChip(
          label: Text(possibleColor, style: TextStyle(color: COLORS[possibleColor])),
          selected: selectedColor == possibleColor,
          onSelected: (selected) {
            if (selected) {
              onColorSelected(possibleColor);
            }
          },
        );
      }).toList(),
    );
  }
}
```

[ChoiceChip](https://api.flutter.dev/flutter/material/ChoiceChip-class.html) est un composant flutter qui affiche un "chip" (un composant clickable) avec une marque indiquant s'il est sélectionné ou non. Vous pouvez voir ceci comme une sorte de radio button ou d'altnerative plus visuelle a une combo box.

Notre composant défini les couleurs possibles, et affiche un ColorChip par couleur. Quand le composant est sélectionné, il appelle une méthode "onColorSelected" qui est fourni en paramètre - l'idée est que ce n'est ce qui doit être fait avec la couleur seléctionnée n'est pas la responsabilité de ColorPicker.

Reste à l'utiliser dans le composant Settings:

```dart
class Settings extends StatelessWidget {
  const Settings({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: navBar(context, 'Settings'),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Consumer<ThemeViewModel>(
          builder: (context, themeViewModel, child) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Pick a main color:'),
                const SizedBox(height: 16.0),
                ColorPicker(
                  selectedColor: themeViewModel.mainColor,
                  onColorSelected: (color) {
                    themeViewModel.mainColor = color;
                  },
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
```

Nous avons ajouté le composant (avec un peu de padding) - et surtout un Consumer pour notre ThemeViewModel, ce qui permet:

- de fournir la couleur actuelle à ColorPicker
- de mettre à jour le ViewModel quand une nouvelle couleur est sélectionnée.

Testez votre application 

> Notez qu'en l'état il faut changer d'écran pour voir les changements !

Dans votre browser, ouvrez le tab Application > LocalStorage dans l'inspecteur et changez les couleurs dans Settings - les valeurs sont adaptées dans le local storage.

> Commitez votre code avec "T06.3 Mise à jour du theme"




