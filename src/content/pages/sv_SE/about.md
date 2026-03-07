---
title: Om oss

---

Hej, jag är Delano, skaparen av Onetime Secret. Det som började 2011 som ett enkelt, säkert sätt att dela känslig information har utvecklats långt bortom den ursprungliga visionen. Mer än ett decennium senare är vi fullt ut i "hemligheter"-branschen och betjänar användningsfall jag aldrig föreställt mig.

## Vad vi har byggt

Under åren har vi vuxit från ett enkelt verktyg till en fokuserad tjänst för delning av känslig information:
- [Anpassade domäner och varumärkesprofil](https://docs.onetimesecret.com/en/custom-domains/) för team och företag
- Flera regioner, inklusive [USA](https://us.onetimesecret.com), [Kanada](https://ca.onetimesecret.com) och [Aotearoa Nya Zeeland](https://nz.onetimesecret.com)
- Prenumerationsplaner som förvandlade en långvarig hobby till en hållbar verksamhet
- Regelbundna releaser på [GitHub](https://github.com/onetimesecret/onetimesecret/releases)

## Vårt tillvägagångssätt

Vi håller fast vid de [grundläggande principer](https://docs.onetimesecret.com/en/principles/) som fick oss att börja. [Vår kod är öppen källkod](https://github.com/onetimesecret/onetimesecret) för att vi tror på transparens, bidrag från gemenskapen och att dela med oss av det goda.

Allteftersom digital integritet och internets utmaningar utvecklas gör vi det också — vi finjusterar säkerheten, gör saker enklare att använda och ser till att vår tjänst fungerar bra för alla som behöver den.

> Visste du? Redan 2011 föreslog Drew Carey att "One Time Secret" skulle vara ett [bra bandnamn](https://x.com/DrewFromTV/status/142730130689761280). Musikbranschens förlust blev internets vinst.

## Förslagslådan

Har du frågor eller idéer? Det finns ett [feedbackformulär](/feedback) längst ner på (nästan) varje sida.

Trevlig delning,
Delano

<img src="/etc/img/delano-g.png" alt="Delano" width="95" height="120" />

---



## F.A.Q.

### Varför skulle jag använda detta?

När du skickar lösenord och privata länkar via e-post eller chatt finns det kopior av den informationen lagrad på många ställen. Om du använder en Onetime-länk istället, finns informationen kvar för en enda visning, vilket innebär att den inte kan läsas av någon annan senare. Detta gör att du kan skicka känslig information på ett säkert sätt med vetskapen om att den endast ses av en person. Tänk på det som ett självförstörande meddelande.

### Varför kan jag inte skicka bilder eller andra typer av filer?

Vår tjänst är utformad specifikt för textbaserade hemligheter för att säkerställa maximal säkerhet och enkelhet. Filer, särskilt bilder, kan innehålla metadata som oavsiktligt kan avslöja information om avsändaren eller mottagaren. Genom att fokusera på text kan vi garantera att ingen ytterligare data överförs utöver vad du uttryckligen skriver. Om du behöver dela en fil säkert rekommenderar vi att du använder en dedikerad säker filöverföringstjänst. Vi kan överväga att lägga till stöd för filer i framtiden om det finns övertygande användningsfall för det.

### Men jag kan kopiera hemlighetstexten. Vad är skillnaden?

Sant, men allt du har är text. Bilder och andra filtyper kan innehålla metadata och annan potentiellt avslöjande information om avsändaren eller mottagaren. Återigen är detta helt enkelt för att säkerställa att ingen privat information delas utanför den avsedda mottagaren.

### Kan jag hämta en hemlighet som redan har delats?

Nej. Vi visar den en gång och raderar den sedan. Efter det är den borta för alltid.

### Vad är skillnaden mellan anonym användning och att ha ett gratiskonto?

Anonyma användare kan skapa hemligheter som varar upp till 7 dagar och har en maximal storlek på 100 KB. Innehavare av gratiskonton får utökade förmåner: hemligheter kan vara upp till 14 dagar och kan vara upp till 1000 KB stora. Kontoinnehavare får också tillgång till ytterligare funktioner som alternativet att bränna före läsning, vilket gör att avsändare kan radera hemligheter innan de tas emot.

### Hur hanterar ni dataförfrågningar från brottsbekämpande myndigheter eller andra tredje parter?

Trogna våra rötter är [vår kod fortfarande öppen källkod](https://github.com/onetimesecret/onetimesecret) på GitHub. När vi navigerar i det föränderliga landskapet av digital integritet och säkerhet är vi engagerade i transparens och ständig förbättring.

Vi har utformat vårt system med integritet i åtanke. Vi lagrar inte hemligheter efter att de har visats, och vi behåller inte åtkomstloggar utöver det absolut nödvändiga. Detta innebär att vi i de flesta fall helt enkelt inte har någon data att tillhandahålla som svar på sådana förfrågningar. För mer information, vänligen granska vår [integritetspolicy](/privacy).

### Varför ska jag lita på er?

Vi har utformat vårt system med integritet och säkerhet som högsta prioritet. Här är varför du kan lita på oss:

- Vi kan inte komma åt din information även om vi ville (vilket vi inte vill). Om du till exempel delar ett lösenord vet vi inte användarnamnet eller ens vilken applikation det gäller.
- Om du använder en lösenfras (tillgänglig under "Sekretessalternativ"), inkluderar vi den i krypteringsnyckeln för hemligheten. Vi lagrar endast en bcrypt-hash av lösenfrasen, vilket gör det omöjligt för oss att dekryptera din hemlighet när den väl har sparats.
- Vår kod är [öppen källkod](https://github.com/onetimesecret/onetimesecret). Du kan granska den själv eller till och med köra din egen instans om du föredrar det.
- Vi använder branschstandardiserade säkerhetspraxis, inklusive HTTPS för alla anslutningar och kryptering i vila för lagrad data.

### Hur fungerar alternativet med lösenfras?

När du använder en lösenfras krypterar vi din hemlighet på våra servrar med den lösenfras du anger. Vi lagrar inte själva lösenfrasen, endast en bcrypt-hash av den. Denna hash används för att verifiera lösenfrasen när mottagaren anger den. Här är varför detta är säkert:

- Vi lagrar aldrig den okrypterade hemligheten eller lösenfrasen.
- Bcrypt-hashen kan inte användas för att dekryptera hemligheten.
- Utan den ursprungliga lösenfrasen kan den krypterade hemligheten inte dekrypteras, inte ens av oss.
- Detta innebär att även om våra servrar skulle komprometteras skulle din hemlighet förbli säker så länge lösenfrasen förblir okänd.

> **Kom ihåg**: Säkerheten för din hemlighet beror på styrkan i din lösenfras och hur säkert du kommunicerar den till mottagaren.
