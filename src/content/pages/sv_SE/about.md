---
title: Om oss
---

<article class="prose dark:prose-invert md:prose-lg lg:prose-xl">
  <h2>
    Om oss
  </h2>

  <p>
    Hej, jag är Delano, skaparen av Onetime Secret. Det som började 2012 som ett enkelt, säkert sätt att dela känslig information har vuxit bortom våra vildaste förväntningar. Över ett decennium senare underlättar vi säker delning av miljontals hemligheter varje månad, med användningsfall vi aldrig föreställt oss.
  </p>

  <p>
    Första halvan av 2024 har varit vår mest hektiska period hittills. Vi är tacksamma för att människor har fortsatt att använda och dela vår produkt i mer än ett decennium. Vi arbetar för närvarande med förbättringar som vi tror kommer att göra tjänsten ännu mer användbar – vi delar mer information snart.
  </p>

  <p>
    Trogna våra rötter, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> på GitHub. När vi navigerar i det föränderliga landskapet av digital integritet och säkerhet är vi engagerade i transparens och ständig förbättring.
  </p>

  <p>
    Tack för att du är en del av vår resa. Skål för ytterligare ett decennium av säker, efemär delning.
  </p>

  <p>
    Om du har några frågor finns det ett feedbackformulär längst ner på (nästan) varje sida.
  </p>

  <p>
    Med vänliga hälsningar,
Delano
  </p>

  <p style="margin-left: 40%; margin-right: 40%">
    <a
      href="https://delanotes.com/"
      title="Delano Mandelbaum"><img
        src="/etc/img/delano-g.png"
        width="95"
        height="120"
        border="0"
      /></a>
  </p>

  <h3>F.A.Q.</h3>

  <h4>Varför skulle jag använda detta?</h4>
  <p>
    När du skickar lösenord och privata länkar via e-post eller chatt finns det kopior av den informationen lagrad på många ställen. Om du använder en Onetime-länk istället, finns informationen kvar för en enda visning, vilket innebär att den inte kan läsas av någon annan senare. Detta gör att du kan skicka känslig information på ett säkert sätt med vetskapen om att den endast ses av en person. Tänk på det som ett självförstörande meddelande.
  </p>

  <h4>Varför kan jag inte skicka bilder eller andra typer av filer?</h4>
  <p>
    Vår tjänst är utformad specifikt för textbaserade hemligheter för att säkerställa maximal säkerhet och enkelhet. Filer, särskilt bilder, kan innehålla metadata som oavsiktligt kan avslöja information om avsändaren eller mottagaren. Genom att fokusera på text kan vi garantera att ingen ytterligare data överförs utöver vad du uttryckligen skriver. Om du behöver dela en fil säkert rekommenderar vi att du använder en dedikerad säker filöverföringstjänst. Vi kan överväga att lägga till stöd för filer i framtiden om det finns övertygande användningsfall för det.
  </p>

  <h4>Men jag kan kopiera hemlighetstexten. Vad är skillnaden?</h4>
  <p>
    Sant, men allt du har är text. Bilder och andra filtyper kan innehålla metadata och annan potentiellt avslöjande information om avsändaren eller mottagaren. Återigen är detta helt enkelt för att säkerställa att ingen privat information delas utanför den avsedda mottagaren.
  </p>

  <h4>Kan jag hämta en hemlighet som redan har delats?</h4>
  <p>
    Nej. Vi visar den en gång och raderar den sedan. Efter det är den borta för alltid.
  </p>

  <h4>Vad är skillnaden mellan anonym användning och att ha ett gratiskonto?</h4>
  <p>
    Anonyma användare kan skapa hemligheter som varar upp till 7 dagar och har en maximal storlek på 100 KB. Innehavare av gratiskonton får utökade förmåner: hemligheter kan vara upp till 14 dagar och kan vara upp till 1000 KB stora. Kontoinnehavare får också tillgång till ytterligare funktioner som alternativet att bränna före läsning, vilket gör att avsändare kan radera hemligheter innan de tas emot.
  </p>

  <h4>Hur hanterar ni dataförfrågningar från brottsbekämpande myndigheter eller andra tredje parter?</h4>
  <p>
    Trogna våra rötter, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> på GitHub. När vi navigerar i det föränderliga landskapet av digital integritet och säkerhet är vi engagerade i transparens och ständig förbättring.
  </p>
  <p>
    Vi har utformat vårt system med integritet i åtanke. Vi lagrar inte hemligheter efter att de har visats, och vi behåller inte åtkomstloggar utöver det absolut nödvändiga. Detta innebär att vi i de flesta fall helt enkelt inte har någon data att tillhandahålla som svar på sådana förfrågningar. För mer information, vänligen granska vår <a href="/privacy">privacy policy</a>.
  </p>

  <h4>Varför ska jag lita på er?</h4>
  <p>
    Vi har utformat vårt system med integritet och säkerhet som högsta prioritet. Här är varför du kan lita på oss:
  </p>
  <ul>
    <li>Vi kan inte komma åt din information även om vi ville (vilket vi inte vill). Om du till exempel delar ett lösenord vet vi inte användarnamnet eller ens vilken applikation det gäller.</li>
    <li>Om du använder en lösenfras (tillgänglig under "Sekretessalternativ"), inkluderar vi den i krypteringsnyckeln för hemligheten. Vi lagrar endast en bcrypt-hash av lösenfrasen, vilket gör det omöjligt för oss att dekryptera din hemlighet när den väl har sparats.</li>
    <li>Vår kod är <a href="https://github.com/onetimesecret/onetimesecret">open source</a>. Du kan granska den själv eller till och med köra din egen instans om du föredrar det.</li>
    <li>Vi använder branschstandardiserade säkerhetspraxis, inklusive HTTPS för alla anslutningar och kryptering i vila för lagrad data.</li>
  </ul>

  <h4>Hur fungerar alternativet med lösenfras?</h4>
  <p>
    När du använder en lösenfras krypterar vi din hemlighet på våra servrar med den lösenfras du anger. Vi lagrar inte själva lösenfrasen, endast en bcrypt-hash av den. Denna hash används för att verifiera lösenfrasen när mottagaren anger den. Här är varför detta är säkert:
  </p>
  <ul>
    <li>Vi lagrar aldrig den okrypterade hemligheten eller lösenfrasen.</li>
    <li>Bcrypt-hashen kan inte användas för att dekryptera hemligheten.</li>
    <li>Utan den ursprungliga lösenfrasen kan den krypterade hemligheten inte dekrypteras, inte ens av oss.</li>
    <li>Detta innebär att även om våra servrar skulle komprometteras skulle din hemlighet förbli säker så länge lösenfrasen förblir okänd.</li>
  </ul>
  <p>
    Kom ihåg att säkerheten för din hemlighet beror på styrkan i din lösenfras och hur säkert du kommunicerar den till mottagaren.
  </p>
</article>
