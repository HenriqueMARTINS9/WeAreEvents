# Redirections et vues des fiches

## Activation en production

1. Appliquer `supabase/migrations/20261118090000_slug_redirects_and_venue_views.sql` au projet Supabase existant, via les migrations habituelles ou le SQL Editor. Pour une nouvelle base, installer d'abord `supabase/schema.sql` et les migrations existantes nécessaires. Le nouveau code du rendu serveur nécessite la table `redirects` : appliquer la migration **avant** de déployer l'application.
2. Déployer le projet Vercel avec les variables Supabase habituelles (`VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE` ou `VITE_SUPABASE_ANON_KEY`). Aucune nouvelle clé privée n'est nécessaire.
3. Vérifier, sans suivre les redirections :

   ```powershell
   curl.exe -sS -I https://www.wearevents.fr/salle/le-paris-clandestin
   curl.exe -sS -I https://www.wearevents.fr/salle/le-myra
   ```

   Résultat attendu : `301` avec `Location: /salle/le-myra`, puis `200` pour la destination.
4. Renommer une fiche et un article de test dans le back office. Vérifier que les anciennes URL répondent en `301` vers leurs nouvelles URL, puis vérifier un second renommage et un retour au slug initial.
5. Ouvrir une fiche, puis le back office → **Vues des fiches** → mois courant → **Actualiser**. Le compteur du lieu doit augmenter. Une nouvelle navigation ou un rechargement compte comme un nouvel affichage.

Ces changements sont préparés dans le dépôt ; la migration et le déploiement de production n'ont pas été exécutés pendant cette intervention.

## Fonctionnement

- Une règle Vercel traite immédiatement `/salle/le-paris-clandestin` (avec ou sans slash final) vers `/salle/le-myra` en `301`.
- Les triggers sur `venues.slug` et `blog_posts.slug` alimentent `redirects` dans la transaction de sauvegarde. Ils couvrent aussi les modifications SQL ou API. Les anciens slugs restent réservés au contenu d'origine.
- Tous les alias d'un contenu pointent directement vers son dernier slug. Revenir à un ancien slug retire l'alias correspondant pour éviter les boucles. Les alias disparaissent lorsque leur contenu est supprimé et restent privés si leur cible est désactivée ou dépubliée.
- Le rendu HTTP consulte les alias avant tout fichier pré-rendu et répond en `301` pour GET et HEAD, en préservant les paramètres de campagne. Les liens internes React vers un alias repassent par ce rendu HTTP.
- Les redirections historiques dans `vercel.json` restent prioritaires. Si leur destination change ultérieurement de slug, elles peuvent produire un saut supplémentaire vers l'alias dynamique.

## Statistiques

`venue_page_views` enregistre un UUID d'événement, l'identifiant du lieu, le slug affiché et un horodatage serveur. Le navigateur déclenche l'enregistrement après chargement de la fiche ; les rerenders n'ajoutent aucune vue. L'UUID empêche un double enregistrement du même événement. Aucun cookie, adresse IP ou identifiant de visiteur n'est enregistré par ce compteur.

Les visites de robots sans JavaScript, les requêtes HEAD, les pages inexistantes et les fiches désactivées ne comptent pas. Un navigateur hors ligne ou bloquant les requêtes de suivi peut empêcher l'enregistrement. Ce compteur mesure des affichages, pas des visiteurs uniques. Il commence à l'activation ; aucun historique de visites n'est reconstitué.

`venue_monthly_page_views` agrège les événements en base selon les mois calendaires de **Europe/Paris**, affiche aussi les lieux à zéro vue, et conserve les vues d'un lieu après renommage grâce à son identifiant. L'agrégation ne subit pas la limite de 1 000 événements par réponse REST. Comme pour le back office existant, les comptes Supabase `authenticated` ont accès aux statistiques ; le public peut uniquement enregistrer un affichage, sans lire les événements ni les agrégats.

## Vérification du 18 novembre 2026

Contrôle HTTP HEAD effectué sur le domaine public `https://www.wearevents.fr`, sans suivre les redirections :

| URL | Statut observé | Location |
| --- | --- | --- |
| `/salle/le-paris-clandestin` | 404 | — |
| `/salle/le-myra` | 200 | — |
| `/blog/location-de-salle-anniversaire-a-paris-le-guide-complet-pour-trouver-le-lieu-ideal` | 301 | `/blog/location-salle-anniversaire-paris` |
| `/blog/combien-coute-la-location-d-une-salle-d-anniversaire-a-paris-le-guide-des-prix-en-2026` | 301 | `/blog/combien-coute-location-salle-anniversaire-paris` |
| `/blog/combien-coute-la-location-d-une-salle-d-anniversaire-a-paris` | 301 | `/blog/combien-coute-location-salle-anniversaire-paris` |
| `/blog/erreurs-a-eviter-avant-reserver-salle-anniversaire` | 301 | `/blog/location-salle-anniversaire-paris` |
| `/blog/restaurant-privatisable-ou-salle-reception-anniversaire` | 301 | `/blog/location-salle-anniversaire-paris` |
| `/blog/bar-loft-rooftop-ou-peniche-anniversaire` | 301 | `/blog/location-salle-anniversaire-paris` |
| `/blog/trouver-salle-anniversaire-derniere-minute-paris` | 301 | `/blog/location-salle-anniversaire-paris` |
| `/blog/apporter-son-gateau-salle-anniversaire-paris` | 301 | `/blog/location-salle-anniversaire-paris` |
| `/blog/jusqu-a-quelle-heure-louer-salle-anniversaire-paris` | 301 | `/blog/location-salle-anniversaire-paris` |
| `/blog/salle-anniversaire-terrasse-paris` | 301 | `/blog/anniversaire-exterieur-paris` |
| `/blog/salle-anniversaire-avec-jardin-paris` | 301 | `/blog/anniversaire-exterieur-paris` |
| `/blog/salle-anniversaire-systeme-son-paris` | 301 | `/blog/salle-ou-danser-paris-anniversaire` |
| `/blog/ou-organiser-anniversaire-pas-cher-paris` | 301 | `/blog/combien-coute-location-salle-anniversaire-paris` |
| `/blog/ou-organiser-anniversaire-20-personnes-paris` | 301 | `/blog/ou-organiser-anniversaire-50-personnes-paris` |

Les valeurs observées décrivent la production avant déploiement du correctif.

## Validation locale

`npm test` vérifie notamment les réponses HTTP GET/HEAD, les renommages successifs, les retours à un ancien slug, les permissions, les limites de mois à Paris, les volumes supérieurs à 1 000 événements et le déclenchement du compteur lors des navigations React. Les tests SQL utilisent PostgreSQL embarqué (PGlite) sans accéder à la production.

La compilation Vite réussit. Sans variables Supabase locales, `npm run build` échoue ensuite sur les contrôles SEO qui exigent des fiches pré-rendues (aucune fiche disponible localement). Le contrôle TypeScript global présente également des erreurs préexistantes en dehors de cette fonctionnalité.
