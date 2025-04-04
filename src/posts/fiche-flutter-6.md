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

## Gestion des notes

Notre application ne se limite évidemment pas à changer la couleur de la barre - le but est de permettre à l'utilisateur de gérer des notes. Une note a un nom, un contenu et un id (généré). Nous voulons que les notes ne disparaissent pas entre chaque usage de l'application, donc il faut une solution de sauvegarde durable.

Les shared preferences vu plus haut ne permettent pas de sauvegarder des objets complexes comme notre liste de notes - heureusement une solution existe sur toutes les plateforme mobiles: sqlite

### sqlite et flutter

[sqlite](https://www.sqlite.org/index.html) est une implémentation opensource complète d'un database engine connu pour être rapide et surtout léger (en taille). Ceci lui a permis d'être installé sur de nombreuses plateforme - en ce compris la majorité des téléphones portables. En d'autre mot c'est une alternative "portable" a des RDMS comme MySQL ou Postgresql.

Flutter dispose du package [sqflite](https://pub.dev/packages/sqflite) pour interagir avec sqlite.

sqlite n'est toutefois pas disponible en web (les navigateurs ont leurs propres solutions à niveau, typiquement [IndexedDB](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API)) - mais un petit hack va nous permettre de développer notre application sans devoir directement tester sur le téléphone.

### Installation de sqlite pour Flutter

Nous allons installer le package sqlflite et son alternative web, sqflite_common_ffi_web:

```bash
flutter pub add sqflite
flutter pub add path
flutter pub add sqflite_common_ffi_web
```

Il faut ensuite tourner une petite ligne de commande (dans le terminal, dans le répertoire de votre application):

```bash
dart run sqflite_common_ffi_web:setup
```

Après ceci vous devriez avoir:

sqflite & sqflite_common_ffi_web dans vos dépendances dans le fichier pubspec.yml:

```yml
dependencies:
  flutter:
    sdk: flutter

  go_router: ^14.8.1
  shared_preferences: ^2.5.3
  provider: ^6.1.4
  sqflite: ^2.4.1
  sqflite_common_ffi_web: ^0.4.5+4
```

Deux fichiers: sqflite_sw.js et sqflite3.wasm dans le folder web. Vérifiez que tout cela est bien présent avant de continuer.

Pour les curieux.ses - sqflite_common_ffi_web réimplémente l'API (ie le fait de pouvoir intérpréter des SQLs) de sqlite on top of... IndexedDB (qui est pourtant du NoSQL). Inefficient et déconseillé pour de la production - mais parfait ici pour garder notre flux de développement rapide dans le navigateur sans avoir à faire appel au simulateur Android.

### Configuration et test de la base de données

Avant d'aller plus loin dans notre application nous allons faire un premier test avec sqlite pour s'assurer que tout est bien installé et configuré. Ceci ne respecte pas les conseils que l'on vous a donné en terme de structure de code - le but ici n'est pas d'avoir une bonne architecture mais de s'assurer que tout fonctionne - dès que cela sera testé, nous allons voir comment organiser cela proprement.

Nous allons ajouter une méthode (asychrhone) à notre fichier main.dart
```dart
Future<Database> initDatabase() async {
  // Initialize your database here
  WidgetsFlutterBinding.ensureInitialized();
  databaseFactory = databaseFactoryFfiWeb; // sqflite web "hack"

  var _database = await openDatabase(
    join(await getDatabasesPath(), 'test.db'),
    version: 1,
  );

  await _database.execute('DROP TABLE IF EXISTS Post');
  await _database.execute(
    'CREATE TABLE Post(id INTEGER PRIMARY KEY, name TEXT, content TEXT)',
  );
  await _database.insert('Post', <String, Object?>{'name': 'Post 1', 'content': 'Content 1'});
  await _database.insert('Post', <String, Object?>{'name': 'Post 2', 'content': 'Content 2'});

  records = await _database.query('Post');
  print(records);
}
```

Que fait cette méthode ?

- Elle remplace la factory (la class qui créer des bases de données) de sqflite par celle de web - c'est ce qui nous permet de travailler en web. Dans un cas réel, cette ligne serait dans un test du type "if dev use web, else use standard sqlite" (via par exemple une variable d'environnement)
- Elle crée et ouvre une base de données dans le fichier "test.db"
- Une fois l'objet database récupéré, il est possible de l'utiliser pour exécuter des SQLs - soit avec l'ordre complet, soit via certaines méthodes qui simplifient l'écriture:

```dart
records = await _database.query('Post');
```

Ceci renvoie tous les "posts" (et est donc l'équivalent de "SELECT * FROM POST").

Notre but est juste de vérifier si cela fonctionne - donc nous créons une table et deux post, que l'on affiche ensuite (via "print" donc dans la console web).

Modifiez la méthode "build" de votre MyApp pour appeler initDatabase() avant le return. Lancez votre applications, vérifiez que votre console montre bien deux records.

> Commitez votre code avec "T06.4 sqflite configuration"

### Repository

Maintenant que nous avons nos éléments technique en place (et testés), nous pouvons structurer l'application correctement:

- Créer un modèle pour Post
- Créer un Repository qui sera la seule classe à interagir avec la base de données
- Créer un ViewModel qui va utiliser le repository
- Passer ce ViewModel au reste de l'application via un Provider

La plupart de ces éléments sont connus. Créez un folder models pour ranger le tout. 

Il nous faut d'abord notre classe Post:

```dart
class Post {
  final int? id;
  final String name;
  final String content;

  Post({this.id, required this.name, required this.content});

  @override
  String toString() {
    return 'Post{id: $id, name: $name, content: $content}';
  }
}
```

L'id est optionnelle car elle sera assignée par la base de donnée - on ne l'aura donc qu'une fois le record inséré.

Nous pouvons maintenant créer un PostRepository:

```dart
class PostRepository {
  late Database _database;

  Database get database => _database;

  Future<Post> createPost(name, content) async {
    final id = await _database.insert('Post', { "name": name, "content": content });
    final post = Post(
      id: id,
      name: name,
      content: content,
    );
    return post;
  }

  Future<void> deletePost(id) async {
    await _database.delete(
      'Post',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<List<Post>> getPosts() async {
    final maps = await _database.query('Post');
    return List.generate(maps.length, (i) {
      return Post(
        id: maps[i]['id'] as int?,
        name: maps[i]['name'] as String,
        content: maps[i]['content'] as String,
      );
    });
  }

  Future<void> initDatabase() async {
    WidgetsFlutterBinding.ensureInitialized();
    databaseFactory = databaseFactoryFfiWeb;
    _database = await openDatabase(
      join(await getDatabasesPath(), 'test.db'),
      version: 1,
    );

    await _database.execute('DROP TABLE IF EXISTS Post');
    await _database.execute(
      'CREATE TABLE Post(id INTEGER PRIMARY KEY, name TEXT, content TEXT)',
    );
    await _database.insert('Post', <String, Object?>{'name': 'Post 1', 'content': 'Content 1'});
    await _database.insert('Post', <String, Object?>{'name': 'Post 2', 'content': 'Content 2'});
  }
}
```

Celui ci dispose du code pour initialiser la base de donnée (le même que testé plus haut), et des méthodes pour interagir avec celle ci et renvoyer des Post. Les méthodes sur la base de données étant asychrone, on renvoie systématiquement des Future.

Nous pouvons enlever notre code d'initialization de la db de main.dart et appeller notre repository à la place dans la méthode main (qui peut elle même être async). C'est l'occasion de "rappatrier" le code de MyApp qui ne fait de toute facon qu'appeller MaterialApp.router dans la méthode main:

```dart
//main.dart
void  main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final databaseProvider = PostRepository();
  await databaseProvider.initDatabase();
  print(databaseProvider.getPosts());

  runApp(ChangeNotifierProvider<ThemeViewModel>(
      create: (context) => ThemeViewModel(),
      child:  // Use the provider to get the theme
      MaterialApp.router(
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
          title: 'My notes',
          theme: ThemeData(
          ))
  ));
}
```

Lancez votre application pour vérifier que tout fonctionne toujours, avec les records affichés dans le log.

> Commitez avec "T06.5 Repository"

### ViewModel et MultiProvider

Nous allons maintenant créer un ViewModel pour donner accès à nos données à notre application:

```dart
class PostViewModel with ChangeNotifier {
  PostRepository postRepository;
  List<Post> _posts = [];

  PostViewModel(this.postRepository) {
    postRepository.getPosts().then((posts) {
      _posts = posts;
      notifyListeners();
    });
  }

  List<Post> get posts => _posts;

  Post getPost(String id) {
    return posts.firstWhere((post) => post.id.toString() == id);
  }

  Future<void> addPost(String name, String content) async {
    final post = await postRepository.createPost(name, content);
    _posts.add(post);
    notifyListeners();
  }

  Future<void> deletePost(int id) async {
    await postRepository.deletePost(id);
    _posts.removeWhere((post) => post.id == id);
    notifyListeners();
  }
}
```

La classe prend le Repository en paramètre, charge tous les posts depuis la base de données et les stocke dans une List - elle fourni également des methodes pour 

- récupérer tous les Posts
- récupérer un Post basé sur son id
- Ajouter un Post
- Supprimer un Post

En somme le "CRUD" typique.

Nous n'avons plus qu'à initiliser ce view model et le passer à notre application - mais il y a un soucis: nous avons déjà un Provider - celui pour le Theme:

```dart
runApp(ChangeNotifierProvider<ThemeViewModel>(
      create: (context) => ThemeViewModel(),
      child:  // Use the provider to get the theme
      MaterialApp.router(
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
          title: 'My notes',
          theme: ThemeData(
          ))
  ));
```

Il est possible de chainer les Provider (faire de l'un l'enfant de l'autre) - mais cela devient vite illisible. Flutter fourni une classe MultiProvider pour ce genre de situations:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final databaseProvider = PostRepository();
  await databaseProvider.initDatabase();
  final model = PostViewModel(databaseProvider);
  runApp(MultiProvider(
      providers: [
        ChangeNotifierProvider<PostViewModel>(
          create: (context) => model,
        ),
        ChangeNotifierProvider<ThemeViewModel>(create:
            (context) => ThemeViewModel()),
      ],
      child: MaterialApp.router(
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
        title: 'My notes',
        theme: ThemeData(
        ),
      ))
  );
}
```

Nous avons donc ajouté notre ViewModel & provider à l'application. Les différents écrans peuvent maintenant récupérer le theme ou les posts ou les deux.

> Commitez avec "T06.6 MultiProvider"

### PostList

A ce stade ci l'application est toujours vide - mais le plus gros est fait. Vu que nous créeons deux post dans le initDatabase, nous pouvons directement tester l'affichage dans PostList:

```dart
    //post_list.dart
    return Scaffold(
      appBar: navBar(context, 'Posts'),
      body:
      Consumer<PostViewModel>(
        builder: (context, model, child) {
          return ListView.builder(
            itemCount: model.posts.length,
            itemBuilder: (context, index) {
              final post = model.posts[index];
              return ListTile(
                title: Text(post.name),
                subtitle: Text(post.content),
                trailing: IconButton(
                  icon: const Icon(Icons.delete),
                  onPressed: () {
                    model.deletePost(post.id!);
                  },
                ),
                onTap: () => context.go('/posts/${post.id}'),
              );
            },
          );
        },
      )
    );
```

Nous utilisons un Consumer qui nous permet d'accéder au PostViewModel - dans ce cas ci à la méthode "posts" qui nous renvoie tous les posts et à deletePost pour en supprimer un. Un click sur un post nous emmene vers un écran qui affiche de détail d'un post (écran qui n'existe pas encore).

### PostDetail

Nous allons créer cet écran - en commençant par la route:

```dart
GoRoute(
    path: 'posts/:id',
    builder: (context, state) => PostDetails(post_id: state.pathParameters['id'] ?? ''),
)
```

Cet écran est lié à une url avec paramètre - qui est récupéré en constructeur de l'écran.

L'écran lui même récupère le post (via notre ViewModel) et l'affiche:

```dart
class PostDetails extends StatelessWidget {
  final String post_id;

  const PostDetails({super.key, required this.post_id});

  @override
  Widget build(BuildContext context) {
    return Consumer<PostViewModel>(builder: (context, model, child) {
      final post = model.getPost(post_id);
      return Scaffold(
          appBar: navBar(context, 'Détails pour ${post.name}'),
          body: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.name,
                ),
                const SizedBox(height: 16.0),
                Text(
                  post.content,
                ),
              ],
            ),
          ));
    });
  }
}
```

Mécansime habituel - un Consumer pour récupérer les méthode sde notre ViewModel.

### New Post

Reste un dernier écran - la forme. La route existe déjà.

```dart
class NewPost extends StatefulWidget {
  const NewPost({super.key});

  @override
  _NewPostState createState() => _NewPostState();
}

class _NewPostState extends State<NewPost> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _contentController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final name = _nameController.text;
      final content = _contentController.text;
      Provider.of<PostViewModel>(context, listen: false).addPost(name, content);
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: navBar(context, "Nouveau post"),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Name'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a name';
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: _contentController,
                decoration: const InputDecoration(labelText: 'Content'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter content';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submit,
                child: const Text('Create Post'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

On retrouve les éléments clés d'une forme:

- Création des controllers
- Le code métier (lien avec le ViewModel) dans "onSubmit"
- Navigator.of(context).pop(); pour retourner à l'écran précédent une fois le submit fait

## Exercice supplémentaire

Créez un nouveau projet appelé "ex6" dans votre repository.

Votre objectif est de créer une application pour gérer sa liste de courses.

Un "Article" devrait contenir:

- Un nom
- Un prix (double)
- Un nombre d'article (initialement 0)

L'écran principal doit montrer la liste de course avec pour chaque article son nom, prix à l'unité, quantité et total.

Il doit également être possible d'ajuster la quantité de chaque article (idéalement sans quitter l'écran) ou de l'enlever.

A tout moment le total du panier doit être visible en bas de l'écran.

Un bouton "+" en bas à droite ("Floating") donnne accès à une forme pour ajouter un article à la liste.

