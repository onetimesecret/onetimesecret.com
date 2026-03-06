---
title: À propos de nous

---

Bonjour, je suis Delano, le créateur de Onetime Secret. Ce qui a commencé en 2012 comme un moyen simple et sécurisé de partager des informations sensibles a évolué bien au-delà de la vision initiale. Plus d'une décennie plus tard, nous sommes pleinement engagés dans le domaine des services de « secrets », répondant à des cas d'utilisation que je n'aurais jamais imaginés.

## Ce que nous avons construit

Au fil des années, nous sommes passés d'un simple outil à un service dédié au partage d'informations sensibles :
- [Domaines personnalisés et image de marque](https://docs.onetimesecret.com/en/custom-domains/) pour les équipes et les entreprises
- Plusieurs régions, dont les [États-Unis](https://us.onetimesecret.com), le [Canada](https://ca.onetimesecret.com) et [Aotearoa Nouvelle-Zélande](https://nz.onetimesecret.com)
- Des formules d'abonnement qui ont transformé un projet de longue date en une activité durable
- Des mises à jour régulières sur [GitHub](https://github.com/onetimesecret/onetimesecret/releases)

## Notre approche

Nous restons fidèles aux [principes fondamentaux](https://docs.onetimesecret.com/en/principles/) qui nous ont lancés. [Notre code est open source](https://github.com/onetimesecret/onetimesecret) parce que nous croyons en la transparence, la contribution de la communauté et le partage de bonnes pratiques.

À mesure que la protection de la vie privée numérique et les défis d'Internet évoluent, nous évoluons aussi — en renforçant la sécurité, en simplifiant l'utilisation et en veillant à ce que notre service fonctionne bien pour tous ceux qui en ont besoin.

> Le saviez-vous ? En 2011, Drew Carey a suggéré que « One Time Secret » ferait un [bon nom de groupe](https://x.com/DrewFromTV/status/142730130689761280). Ce que l'industrie musicale a perdu, Internet l'a gagné.

## La boîte à suggestions

Vous avez des questions ou des idées ? Il y a un [formulaire de rétroaction](/feedback) en bas de (presque) chaque page.

Bon partage,
Delano

<img src="/etc/img/delano-g.png" alt="Delano" width="95" height="120" />

---



## F.A.Q.

### Pourquoi l'utiliser ?

Lorsque vous envoyez des mots de passe et des liens privés par courriel ou par clavardage, des copies de ces informations sont stockées dans de nombreux endroits. Si vous utilisez plutôt un lien Onetime, les informations sont conservées pour une seule consultation, ce qui signifie qu'elles ne peuvent pas être lues par quelqu'un d'autre par la suite. Cela vous permet d'envoyer des informations sensibles en toute sécurité, en sachant qu'elles ne seront vues que par une seule personne. C'est un peu comme un message autodestructeur.

### Pourquoi ne puis-je pas envoyer des images ou d'autres types de fichiers ?

Notre service est conçu spécifiquement pour les secrets textuels afin de garantir une sécurité et une simplicité maximales. Les fichiers, en particulier les images, peuvent contenir des métadonnées susceptibles de révéler involontairement des informations sur l'expéditeur ou le destinataire. En nous concentrant sur le texte, nous pouvons garantir qu'aucune donnée supplémentaire n'est transmise au-delà de ce que vous tapez explicitement. Si vous devez partager un fichier en toute sécurité, nous vous recommandons d'utiliser un service de transfert de fichiers sécurisé dédié. Nous pourrons envisager d'ajouter la prise en charge des fichiers à l'avenir si des cas d'utilisation convaincants le justifient.

### Mais je peux copier le texte secret. Quelle est la différence ?

C'est vrai, mais vous n'avez que du texte. Les images et autres types de fichiers peuvent contenir des métadonnées et d'autres informations potentiellement révélatrices sur l'expéditeur ou le destinataire. Là encore, il s'agit simplement de s'assurer qu'aucune information privée n'est partagée en dehors du destinataire prévu.

### Puis-je récupérer un secret qui a déjà été partagé ?

Non. Nous l'affichons une fois, puis nous le supprimons. Après cela, il disparaît à jamais.

### Quelle est la différence entre une utilisation anonyme et un compte gratuit ?

Les utilisateurs anonymes peuvent créer des secrets d'une durée maximale de 7 jours et d'une taille maximale de 100 Ko. Les titulaires d'un compte gratuit bénéficient d'avantages supplémentaires : les secrets peuvent durer jusqu'à 14 jours et avoir une taille maximale de 1000 Ko. Les titulaires de comptes ont également accès à des fonctionnalités supplémentaires telles que les options de destruction avant lecture, qui permettent aux expéditeurs de supprimer les secrets avant qu'ils ne soient reçus.

### Comment gérez-vous les demandes de données émanant des forces de l'ordre ou d'autres tiers ?

Fidèles à nos racines, [notre code reste open source](https://github.com/onetimesecret/onetimesecret) sur GitHub. Alors que nous naviguons dans le paysage en constante évolution de la protection de la vie privée et de la sécurité numérique, nous nous engageons à faire preuve de transparence et à nous améliorer continuellement.

Nous avons conçu notre système en tenant compte de la protection de la vie privée. Nous ne stockons pas les secrets après qu'ils ont été consultés et nous ne conservons pas les journaux d'accès au-delà du minimum nécessaire. Cela signifie que, dans la plupart des cas, nous n'avons tout simplement pas de données à fournir en réponse à de telles demandes. Pour plus de détails, veuillez consulter notre [politique de confidentialité](/privacy).

### Pourquoi devrais-je vous faire confiance ?

Nous avons conçu notre système en plaçant la protection de la vie privée et la sécurité en tête de nos priorités. Voici pourquoi vous pouvez nous faire confiance :

- Nous ne pouvons pas accéder à vos informations même si nous le voulions (ce qui n'est pas le cas). Par exemple, si vous partagez un mot de passe, nous ne connaissons pas le nom d'utilisateur ni même l'application à laquelle il est destiné.
- Si vous utilisez une phrase de passe (disponible sous « Options de confidentialité »), nous l'incluons dans la clé de chiffrement du secret. Nous ne stockons qu'un hachage bcrypt de la phrase de passe, ce qui rend impossible le déchiffrement de votre secret une fois qu'il est sauvegardé.
- Notre code est [open source](https://github.com/onetimesecret/onetimesecret). Vous pouvez l'examiner vous-même ou même exécuter votre propre instance si vous le préférez.
- Nous utilisons des pratiques de sécurité conformes aux normes industrielles, notamment le protocole HTTPS pour toutes les connexions et le chiffrement au repos pour les données stockées.

### Comment fonctionne l'option de phrase de passe ?

Lorsque vous utilisez une phrase de passe, nous chiffrons votre secret sur nos serveurs à l'aide de la phrase de passe que vous fournissez. Nous ne stockons pas la phrase de passe elle-même, mais seulement un hachage bcrypt de celle-ci. Ce hachage est utilisé pour vérifier la phrase de passe lorsque le destinataire la saisit. Voici pourquoi cette méthode est sûre :

- Nous ne stockons jamais le secret non chiffré ou la phrase de passe.
- Le hachage bcrypt ne peut pas être utilisé pour déchiffrer le secret.
- Sans la phrase de passe originale, le secret chiffré ne peut pas être déchiffré, même par nous.
- Cela signifie que même si nos serveurs étaient compromis, votre secret resterait sécurisé tant que la phrase de passe reste inconnue.

> **N'oubliez pas** : la sécurité de votre secret dépend de la force de votre phrase de passe et de la sécurité avec laquelle vous la communiquez au destinataire.
