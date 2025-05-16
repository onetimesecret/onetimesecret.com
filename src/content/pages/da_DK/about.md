---
title: Om os
---

<article class="prose dark:prose-invert md:prose-lg lg:prose-xl">
  <h2>
    Om os
  </h2>

  <p>
    Hej, jeg er {name}, skaberen af Onetime Secret. Det, der startede i 2012 som en enkel og sikker måde at dele følsomme oplysninger på, er vokset ud over vores vildeste forventninger. Over et årti senere faciliterer vi sikker deling af millioner af hemmeligheder hver måned med anvendelsesmuligheder, vi aldrig havde forestillet os.
  </p>

  <p>
    Den første halvdel af 2024 har været vores travleste periode hidtil. Vi er taknemmelige for, at folk er blevet ved med at bruge og dele vores produkt i mere end et årti. Vi arbejder i øjeblikket på forbedringer, som vi tror vil gøre tjenesten endnu mere nyttig - vi vil snart dele flere detaljer.
  </p>

  <p>
    Tro mod vores rødder, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> på GitHub. Mens vi navigerer i det udviklende landskab af digitalt privatliv og sikkerhed, er vi forpligtet til gennemsigtighed og løbende forbedringer.
  </p>

  <p>
    Tak, fordi du har været en del af vores rejse. Skål for endnu et årti med sikker, flygtig deling.
  </p>

  <p>
    Hvis du har spørgsmål, er der en feedbackformular nederst på (næsten) alle sider.
  </p>

  <p>
    God fornøjelse med at dele,
    {name}
  </p>

  <p style="margin-left: 40%; margin-right: 40%">
    <a
      href="https://delanotes.com/"
      title="Delano Mandelbaum"><img
        src="/public/etc/img/delano-g.png"
        width="95"
        height="120"
        border="0"
      /></a>
  </p>

  <h3>F.A.Q.</h3>

  <h4>Hvorfor skulle jeg bruge dette?</h4>
  <p>
    Når du sender folk adgangskoder og private links via e-mail eller chat, gemmes der kopier af disse oplysninger mange steder. Hvis du i stedet bruger et Onetime-link, gemmes oplysningerne til en enkelt visning, hvilket betyder, at de ikke kan læses af andre senere. Det giver dig mulighed for at sende følsomme oplysninger på en sikker måde, velvidende at de kun kan ses af én person. Tænk på det som en selvdestruerende besked.
  </p>

  <h4>Hvorfor kan jeg ikke sende billeder eller andre slags filer?</h4>
  <p>
    Vores tjeneste er designet specifikt til tekstbaserede hemmeligheder for at sikre maksimal sikkerhed og enkelhed. Filer, især billeder, kan indeholde metadata, som utilsigtet kan afsløre oplysninger om afsenderen eller modtageren. Ved at fokusere på tekst kan vi garantere, at der ikke overføres yderligere data ud over det, du eksplicit skriver. Hvis du har brug for at dele en fil sikkert, anbefaler vi, at du bruger en dedikeret sikker filoverførselstjeneste. Vi kan overveje at tilføje understøttelse af filer i fremtiden, hvis der er overbevisende brugssager for det.
  </p>

  <h4>Men jeg kan kopiere den hemmelige tekst. Hvad er forskellen?</h4>
  <p>
    Ja, men du har kun tekst. Billeder og andre filtyper kan indeholde metadata og andre potentielt afslørende oplysninger om afsenderen eller modtageren. Igen er dette blot for at sikre, at ingen private oplysninger deles uden for den tilsigtede modtager.
  </p>

  <h4>Kan jeg hente en hemmelighed, der allerede er blevet delt?</h4>
  <p>
    Nej. Vi viser den én gang og sletter den derefter. Derefter er den væk for altid.
  </p>

  <h4>Hvad er forskellen på anonym brug og at have en gratis konto?</h4>
  <p>
    Anonyme brugere kan oprette hemmeligheder, der varer op til 7 dage og har en maksimal størrelse på 100. KB. Indehavere af gratis konti får udvidede fordele: Hemmeligheder kan vare op til 14 dage og kan være op til 1000 KB store. KB i størrelse. Kontohavere får også adgang til yderligere funktioner som burn-before-reading, som giver afsendere mulighed for at slette hemmeligheder, før de modtages.
  </p>

  <h4>Hvordan håndterer du dataanmodninger fra retshåndhævende myndigheder eller andre tredjeparter?</h4>
  <p>
    Tro mod vores rødder, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> på GitHub. Mens vi navigerer i det udviklende landskab af digitalt privatliv og sikkerhed, er vi forpligtet til gennemsigtighed og løbende forbedringer.
  </p>
  <p>
    Vi har designet vores system med tanke på privatlivets fred. Vi gemmer ikke hemmeligheder, efter at de er blevet set, og vi opbevarer ikke adgangslogs ud over det nødvendige minimum. Det betyder, at vi i de fleste tilfælde simpelthen ikke har nogen data at give som svar på sådanne anmodninger. For flere detaljer, se venligst vores <a href="/privacy">privacy policy</a>.
  </p>

  <h4>Hvorfor skal jeg stole på dig?</h4>
  <p>
    Vi har designet vores system med privatlivets fred og sikkerhed som topprioritet. Her er, hvorfor du kan stole på os:
  </p>
  <ul>
    <li>Vi kan ikke få adgang til dine oplysninger, selv hvis vi ville (hvilket vi ikke gør). Hvis du f.eks. deler en adgangskode, kender vi ikke brugernavnet eller den applikation, det er til.</li>
    <li>Hvis du bruger en passphrase (tilgængelig under "Privacy Options"), inkluderer vi den i krypteringsnøglen for hemmeligheden. Vi gemmer kun en bcrypt-hash af adgangssætningen, hvilket gør det umuligt for os at dekryptere din hemmelighed, når den er gemt.</li>
    <li>Vores kode er <a href="https://github.com/onetimesecret/onetimesecret">open source</a>. Du kan selv gennemgå den eller endda køre din egen instans, hvis du foretrækker det.</li>
    <li>Vi bruger industristandard sikkerhedspraksis, herunder HTTPS for alle forbindelser og kryptering i hvile for lagrede data.</li>
  </ul>

  <h4>Hvordan fungerer passphrase-indstillingen?</h4>
  <p>
    Når du bruger en adgangssætning, krypterer vi din hemmelighed på vores servere ved hjælp af den adgangssætning, du angiver. Vi gemmer ikke selve adgangssætningen, men kun et bcrypt-hash af den. Denne hash bruges til at verificere passphrasen, når modtageren indtaster den. Her er grunden til, at det er sikkert:
  </p>
  <ul>
    <li>Vi gemmer aldrig den ukrypterede hemmelighed eller adgangssætningen.</li>
    <li>bcrypt-hash kan ikke bruges til at dekryptere hemmeligheden.</li>
    <li>Uden den oprindelige passphrase kan den krypterede hemmelighed ikke dekrypteres, selv ikke af os.</li>
    <li>Det betyder, at selv hvis vores servere blev kompromitteret, ville din hemmelighed forblive sikker, så længe adgangssætningen forbliver ukendt.</li>
  </ul>
  <p>
    Husk, at sikkerheden af din hemmelighed afhænger af styrken af din passphrase, og hvor sikkert du kommunikerer den til modtageren.
  </p>
</article>
