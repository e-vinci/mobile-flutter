# Cours 1 - Setup & Controllers

## Intro

### Objectifs

- Objectif: vous donnez le nécessaire pour votre cours de projet
- Juste trois semaine
- Reproduction de ce que vous avez [déjà fait en JS](https://github.com/e-vinci/jwt-ts-api-boilerplate)

### Spring

### Backend

On ne va construire ici que un backend - ie notre application se limite à produire et accepter du JSON. L'idée est qu'un front end web type React, Angular (voir une application mobile en Flutter !) va gérer les interfaces (hors sujet pour ce cours).

Pour tester:
- Browser
- Curl
- Fichiers .http dans Intellij


## Setup

- Intellij
  - JDK (on recommande BellSoft Liberica 21)
- DataGrip

## Qs

Quid git/push ?

Explain:
- Web (reminder)
- Maven
- Spring annotation/dependency injections
- Dependencies
  - Lombok
  - Spring Web
  - /  JPA
- Running an app
- Running docker for PGSQL
- Testing
  - Browser
  - Http Requests 
- When things do badly
  - Read your terminal logs
  - Some examples
- Careful about IDE "magic"
  - Still need to understand what's behind

Todo:
- Create Spring Boot App
  - Careful about dependencies 
  - Create controller ("hello")
    - test via browser
    - test via curl
    - test via http request
  - Create controller with service ("drinks")
    - Create model ?
    - Use fake data in service (array)
        - test via browser
        - test via curl
        - test via http request

Check:
- run http request in Intellij

Don't start with JPA (else we need the DB day 1 and that does not make sense) - push new project using JPA for Fiche 2

# Cours 2 - DB & Repositories

## Qs

- Intro docker pour PG
- Configuration
- Seed (?)
- Ouvrir datagrip à côté pour regarder

# Cours 3 - Autenthification