---
title: Om os

---

Hej, jeg er Delano, skaberen af Onetime Secret. Det, der startede i 2012 som en enkel og sikker måde at dele følsomme oplysninger på, har udviklet sig langt ud over den oprindelige vision. Mere end et årti senere er vi fuldt ud i "hemmeligheder"-branchen og betjener brugssituationer, jeg aldrig havde forestillet mig.

## Hvad vi har bygget

I årenes løb er vi vokset fra et simpelt værktøj til en fokuseret tjeneste til deling af følsomme oplysninger:
- [Tilpassede domæner og branding](https://docs.onetimesecret.com/en/custom-domains/) til teams og virksomheder
- Flere regioner, herunder [USA](https://us.onetimesecret.com), [Canada](https://ca.onetimesecret.com) og [Aotearoa New Zealand](https://nz.onetimesecret.com)
- Abonnementsplaner, der forvandlede en langvarig hobby til en bæredygtig forretning
- Regelmæssige udgivelser på [GitHub](https://github.com/onetimesecret/onetimesecret/releases)

## Vores tilgang

Vi holder fast i de [grundlæggende principper](https://docs.onetimesecret.com/en/principles/), der fik os i gang. [Vores kode er open source](https://github.com/onetimesecret/onetimesecret), fordi vi tror på gennemsigtighed, input fra fællesskabet og på at dele det gode.

Efterhånden som digitalt privatliv og internettets udfordringer udvikler sig, gør vi det også — vi finpudser sikkerheden, gør tingene lettere at bruge og sikrer, at vores tjeneste fungerer godt for alle, der har brug for den.

> Vidste du det? Tilbage i 2011 foreslog Drew Carey, at "One Time Secret" ville være et [godt bandnavn](https://x.com/DrewFromTV/status/142730130689761280). Musikbranchens tab blev internettets gevinst.

## Forslagskassen

Har du spørgsmål eller idéer? Der er en [feedbackformular](/feedback) nederst på (næsten) alle sider.

God fornøjelse med at dele,
Delano

<img src="/etc/img/delano-g.png" alt="Delano" width="95" height="120" />

---



## F.A.Q.

### Hvorfor skulle jeg bruge dette?

Når du sender folk adgangskoder og private links via e-mail eller chat, gemmes der kopier af disse oplysninger mange steder. Hvis du i stedet bruger et Onetime-link, gemmes oplysningerne til en enkelt visning, hvilket betyder, at de ikke kan læses af andre senere. Det giver dig mulighed for at sende følsomme oplysninger på en sikker måde, velvidende at de kun kan ses af én person. Tænk på det som en selvdestruerende besked.

### Hvorfor kan jeg ikke sende billeder eller andre slags filer?

Vores tjeneste er designet specifikt til tekstbaserede hemmeligheder for at sikre maksimal sikkerhed og enkelhed. Filer, især billeder, kan indeholde metadata, som utilsigtet kan afsløre oplysninger om afsenderen eller modtageren. Ved at fokusere på tekst kan vi garantere, at der ikke overføres yderligere data ud over det, du eksplicit skriver. Hvis du har brug for at dele en fil sikkert, anbefaler vi, at du bruger en dedikeret sikker filoverførselstjeneste. Vi kan overveje at tilføje understøttelse af filer i fremtiden, hvis der er overbevisende brugssager for det.

### Men jeg kan kopiere den hemmelige tekst. Hvad er forskellen?

Ja, men du har kun tekst. Billeder og andre filtyper kan indeholde metadata og andre potentielt afslørende oplysninger om afsenderen eller modtageren. Igen er dette blot for at sikre, at ingen private oplysninger deles uden for den tilsigtede modtager.

### Kan jeg hente en hemmelighed, der allerede er blevet delt?

Nej. Vi viser den én gang og sletter den derefter. Derefter er den væk for altid.

### Hvad er forskellen på anonym brug og at have en gratis konto?

Anonyme brugere kan oprette hemmeligheder, der varer op til 7 dage og har en maksimal størrelse på 100 KB. Indehavere af gratis konti får udvidede fordele: hemmeligheder kan vare op til 14 dage og kan være op til 1000 KB i størrelse. Kontohavere får også adgang til yderligere funktioner som burn-before-reading, som giver afsendere mulighed for at slette hemmeligheder, før de modtages.

### Hvordan håndterer I dataanmodninger fra retshåndhævende myndigheder eller andre tredjeparter?

Tro mod vores rødder er [vores kode fortsat open source](https://github.com/onetimesecret/onetimesecret) på GitHub. Mens vi navigerer i det udviklende landskab af digitalt privatliv og sikkerhed, er vi forpligtet til gennemsigtighed og løbende forbedringer.

Vi har designet vores system med tanke på privatlivets fred. Vi gemmer ikke hemmeligheder, efter at de er blevet set, og vi opbevarer ikke adgangslogs ud over det nødvendige minimum. Det betyder, at vi i de fleste tilfælde simpelthen ikke har nogen data at give som svar på sådanne anmodninger. For flere detaljer, se venligst vores [privatlivspolitik](/privacy).

### Hvorfor skal jeg stole på jer?

Vi har designet vores system med privatlivets fred og sikkerhed som topprioritet. Her er, hvorfor du kan stole på os:

- Vi kan ikke få adgang til dine oplysninger, selv hvis vi ville (hvilket vi ikke gør). Hvis du f.eks. deler en adgangskode, kender vi ikke brugernavnet eller den applikation, det er til.
- Hvis du bruger en adgangssætning (tilgængelig under "Privatlivsindstillinger"), inkluderer vi den i krypteringsnøglen for hemmeligheden. Vi gemmer kun en bcrypt-hash af adgangssætningen, hvilket gør det umuligt for os at dekryptere din hemmelighed, når den er gemt.
- Vores kode er [open source](https://github.com/onetimesecret/onetimesecret). Du kan selv gennemgå den eller endda køre din egen instans, hvis du foretrækker det.
- Vi bruger industristandard sikkerhedspraksis, herunder HTTPS for alle forbindelser og kryptering i hvile for lagrede data.

### Hvordan fungerer adgangssætning-indstillingen?

Når du bruger en adgangssætning, krypterer vi din hemmelighed på vores servere ved hjælp af den adgangssætning, du angiver. Vi gemmer ikke selve adgangssætningen, men kun en bcrypt-hash af den. Denne hash bruges til at verificere adgangssætningen, når modtageren indtaster den. Her er grunden til, at det er sikkert:

- Vi gemmer aldrig den ukrypterede hemmelighed eller adgangssætningen.
- Bcrypt-hashen kan ikke bruges til at dekryptere hemmeligheden.
- Uden den oprindelige adgangssætning kan den krypterede hemmelighed ikke dekrypteres, selv ikke af os.
- Det betyder, at selv hvis vores servere blev kompromitteret, ville din hemmelighed forblive sikker, så længe adgangssætningen forbliver ukendt.

> **Husk**: Sikkerheden af din hemmelighed afhænger af styrken af din adgangssætning, og hvor sikkert du kommunikerer den til modtageren.
