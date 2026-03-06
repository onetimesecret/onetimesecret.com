---
title: Over ons

---

Hallo, ik ben Delano, de maker van Onetime Secret. Wat in 2012 begon als een eenvoudige, veilige manier om gevoelige informatie te delen, is ver voorbij de oorspronkelijke visie gegroeid. Meer dan tien jaar later zitten we volledig in de "geheimen"-business en bedienen we toepassingen die ik me nooit had voorgesteld.

## Wat we hebben gebouwd

Door de jaren heen zijn we gegroeid van een eenvoudig hulpmiddel tot een gerichte dienst voor het delen van gevoelige informatie:
- [Eigen domeinen en branding](https://docs.onetimesecret.com/en/custom-domains/) voor teams en bedrijven
- Meerdere regio's, waaronder [VS](https://us.onetimesecret.com), [Canada](https://ca.onetimesecret.com) en [Aotearoa Nieuw-Zeeland](https://nz.onetimesecret.com)
- Abonnementsplannen die een jarenlange hobby in een duurzaam bedrijf hebben omgezet
- Regelmatige releases op [GitHub](https://github.com/onetimesecret/onetimesecret/releases)

## Onze aanpak

We houden vast aan de [kernprincipes](https://docs.onetimesecret.com/en/principles/) waarmee we begonnen zijn. [Onze code is open source](https://github.com/onetimesecret/onetimesecret) omdat we geloven in transparantie, input van de community en het delen van goede dingen.

Zoals digitale privacy en de uitdagingen van het internet zich ontwikkelen, doen wij dat ook -- we verbeteren de beveiliging, maken dingen makkelijker in gebruik en zorgen ervoor dat onze dienst goed werkt voor iedereen die hem nodig heeft.

> Wist je dat? In 2011 suggereerde Drew Carey dat "One Time Secret" een [goede bandnaam](https://x.com/DrewFromTV/status/142730130689761280) zou zijn. Het verlies van de muziekindustrie was de winst van het internet.

## De ideeenbus

Heb je vragen of ideeen? Er staat een [feedbackformulier](/feedback) onderaan (bijna) elke pagina.

Fijn delen,
Delano

<img src="/etc/img/delano-g.png" alt="Delano" width="95" height="120" />

---



## F.A.Q.

### Waarom zou ik dit gebruiken?

Wanneer je wachtwoorden en privelinks via e-mail of chat naar mensen stuurt, worden er kopieen van die informatie op veel plaatsen opgeslagen. Als je in plaats daarvan een Onetime-link gebruikt, blijft de informatie slechts beschikbaar voor een enkele weergave, wat betekent dat het later niet door iemand anders kan worden gelezen. Hierdoor kun je gevoelige informatie op een veilige manier versturen, wetende dat het door slechts een persoon wordt gezien. Zie het als een zelfvernietigend bericht.

### Waarom kan ik geen afbeeldingen of andere soorten bestanden versturen?

Onze dienst is specifiek ontworpen voor tekstgebaseerde geheimen om maximale veiligheid en eenvoud te garanderen. Bestanden, vooral afbeeldingen, kunnen metadata bevatten die onbedoeld informatie over de afzender of ontvanger kan onthullen. Door ons te concentreren op tekst, kunnen we garanderen dat er geen aanvullende gegevens worden verzonden buiten wat je expliciet typt. Als je veilig een bestand wilt delen, raden we aan een speciale beveiligde bestandsoverdrachtservice te gebruiken. We kunnen in de toekomst ondersteuning voor bestanden overwegen als er overtuigende gebruikssituaties voor zijn.

### Maar ik kan de geheime tekst kopieren. Wat is het verschil?

Dat klopt, maar alles wat je hebt is tekst. Afbeeldingen en andere bestandstypen kunnen metadata en andere potentieel onthullende informatie over de afzender of ontvanger bevatten. Dit is simpelweg om ervoor te zorgen dat er geen prive-informatie wordt gedeeld buiten de beoogde ontvanger.

### Kan ik een geheim terughalen dat al is gedeeld?

Nee. We tonen het een keer en verwijderen het dan. Daarna is het voor altijd verdwenen.

### Wat is het verschil tussen anoniem gebruik en een gratis account?

Anonieme gebruikers kunnen geheimen maken die maximaal 7 dagen geldig zijn en een maximale grootte van 100 KB hebben. Houders van een gratis account krijgen extra voordelen: geheimen kunnen tot 14 dagen geldig zijn en tot 1000 KB groot zijn. Accounthouders hebben ook toegang tot extra functies zoals de verwijder-voor-lezen-optie, waarmee afzenders geheimen kunnen verwijderen voordat ze worden ontvangen.

### Hoe ga je om met gegevensverzoeken van wetshandhavingsinstanties of andere derden?

Trouw aan onze roots is [onze code open source](https://github.com/onetimesecret/onetimesecret) op GitHub. Terwijl we door het veranderende landschap van digitale privacy en veiligheid navigeren, blijven we toegewijd aan transparantie en voortdurende verbetering.

We hebben ons systeem ontworpen met privacy in gedachten. We slaan geheimen niet op nadat ze zijn bekeken, en we houden geen toegangslogboeken bij buiten het minimum dat noodzakelijk is. Dit betekent dat we in de meeste gevallen simpelweg geen gegevens hebben om te verstrekken in reactie op dergelijke verzoeken. Voor meer details kun je ons [privacybeleid](/privacy) bekijken.

### Waarom zou ik jullie vertrouwen?

We hebben ons systeem ontworpen met privacy en veiligheid als topprioriteiten. Dit is waarom je ons kunt vertrouwen:

- We kunnen je informatie niet inzien, zelfs als we dat zouden willen (wat we niet willen). Als je bijvoorbeeld een wachtwoord deelt, weten we niet de gebruikersnaam of zelfs de toepassing waarvoor het is.
- Als je een wachtwoordzin gebruikt (beschikbaar onder "Privacy-opties"), nemen we die op in de versleutelingssleutel voor het geheim. We slaan alleen een bcrypt-hash van de wachtwoordzin op, waardoor het voor ons onmogelijk is om je geheim te ontsleutelen zodra het is opgeslagen.
- Onze code is [open source](https://github.com/onetimesecret/onetimesecret). Je kunt deze zelf beoordelen of zelfs je eigen instantie draaien als je dat wilt.
- We gebruiken industriestandaard beveiligingspraktijken, waaronder HTTPS voor alle verbindingen en versleuteling in rust voor opgeslagen gegevens.

### Hoe werkt de wachtwoordzin-optie?

Wanneer je een wachtwoordzin gebruikt, versleutelen we je geheim op onze servers met de wachtwoordzin die je opgeeft. We slaan de wachtwoordzin zelf niet op, alleen een bcrypt-hash ervan. Deze hash wordt gebruikt om de wachtwoordzin te verifieren wanneer de ontvanger deze invoert. Dit is waarom dit veilig is:

- We slaan nooit het onversleutelde geheim of de wachtwoordzin op.
- De bcrypt-hash kan niet worden gebruikt om het geheim te ontsleutelen.
- Zonder de originele wachtwoordzin kan het versleutelde geheim niet worden ontsleuteld, zelfs niet door ons.
- Dit betekent dat zelfs als onze servers gecompromitteerd zouden worden, je geheim veilig blijft zolang de wachtwoordzin onbekend blijft.

> **Onthoud**: De veiligheid van je geheim hangt af van de sterkte van je wachtwoordzin en hoe veilig je deze communiceert aan de ontvanger.
