# Guide de contribution

Ce document définit la convention Git à appliquer lorsque le développement commencera.

## Branches permanentes

- `main` contient uniquement les versions stables et publiables.
- `develop` sert de branche d’intégration pour les travaux en cours.

## Branches de travail

Toute branche de travail est créée depuis `develop`, sauf une branche `hotfix/`, créée depuis `main` pour corriger une urgence en production.

| Préfixe | Usage | Exemple |
| --- | --- | --- |
| `feature/nom-court` | Nouvelle fonctionnalité | `feature/digital-ticket` |
| `fix/nom-court` | Correction non urgente | `fix/seat-map-refresh` |
| `test/nom-court` | Ajout ou amélioration de tests | `test/reservation-flow` |
| `docs/nom-court` | Documentation uniquement | `docs/api-overview` |
| `chore/nom-court` | Maintenance et outillage | `chore/update-dependencies` |
| `hotfix/nom-court` | Correction urgente depuis `main` | `hotfix/payment-timeout` |

Le nom court doit être explicite, en minuscules, sans espace ni accent, avec des mots séparés par des tirets.

## Flux de contribution

1. Mettre à jour la branche source (`develop`, ou `main` pour un hotfix).
2. Créer une branche respectant la convention ci-dessus.
3. Effectuer des commits ciblés avec des messages clairs.
4. Pousser la branche et ouvrir une pull request vers `develop` (ou vers `main` pour un hotfix).
5. Ne fusionner qu’après revue et validation des contrôles réellement disponibles.

Ne jamais ajouter de secret, de fichier `.env` réel, de résultat de test inventé ou de preuve technique non produite.
