---
title: Chi siamo

---

Ciao, sono Delano, il creatore di Onetime Secret. Quello che nel 2011 è iniziato come un modo semplice e sicuro per condividere informazioni sensibili si è evoluto ben oltre la visione iniziale. Più di un decennio dopo, siamo completamente immersi nel business dei servizi per i "segreti", rispondendo a casi d'uso che non avrei mai immaginato.

## Cosa abbiamo costruito

Nel corso degli anni, siamo passati da un semplice strumento a un servizio dedicato alla condivisione di informazioni sensibili:
- [Domini personalizzati e branding](https://docs.onetimesecret.com/en/custom-domains/) per team e aziende
- Più regioni, tra cui [Stati Uniti](https://us.onetimesecret.com), [Canada](https://ca.onetimesecret.com) e [Aotearoa Nuova Zelanda](https://nz.onetimesecret.com)
- Piani di abbonamento che hanno trasformato un progetto di lunga data in un'attività sostenibile
- Rilasci regolari su [GitHub](https://github.com/onetimesecret/onetimesecret/releases)

## Il nostro approccio

Restiamo fedeli ai [principi fondamentali](https://docs.onetimesecret.com/en/principles/) che ci hanno dato il via. [Il nostro codice è open source](https://github.com/onetimesecret/onetimesecret) perché crediamo nella trasparenza, nel contributo della comunità e nella condivisione delle buone pratiche.

Man mano che la privacy digitale e le sfide di Internet si evolvono, ci evolviamo anche noi — perfezionando la sicurezza, rendendo le cose più facili da usare e assicurandoci che il nostro servizio funzioni bene per tutti coloro che ne hanno bisogno.

> Lo sapevi? Nel 2011, Drew Carey ha suggerito che "One Time Secret" sarebbe stato un [buon nome per una band](https://x.com/DrewFromTV/status/142730130689761280). Quello che l'industria musicale ha perso, Internet lo ha guadagnato.

## La cassetta dei suggerimenti

Hai domande o idee? C'è un [modulo di feedback](/feedback) in fondo a (quasi) ogni pagina.

Buona condivisione,
Delano

<img src="/etc/img/delano-g.png" alt="Delano" width="95" height="120" />

---



## F.A.Q.

### Perché dovrei usarlo?

Quando invii password e link privati via e-mail o chat, copie di queste informazioni vengono archiviate in molti luoghi. Se invece usi un link Onetime, le informazioni restano disponibili per una sola visualizzazione, il che significa che non possono essere lette da qualcun altro in seguito. Questo ti permette di inviare informazioni sensibili in modo sicuro, sapendo che saranno viste da una sola persona. Pensalo come un messaggio che si autodistrugge.

### Perché non posso inviare immagini o altri tipi di file?

Il nostro servizio è progettato specificamente per i segreti testuali, in modo da garantire la massima sicurezza e semplicità. I file, soprattutto le immagini, possono contenere metadati che potrebbero rivelare involontariamente informazioni sul mittente o sul destinatario. Concentrandoci sul testo, possiamo garantire che non vengano trasmessi dati aggiuntivi oltre a quelli che digiti esplicitamente. Se hai bisogno di condividere un file in modo sicuro, ti consigliamo di utilizzare un servizio dedicato al trasferimento sicuro di file. Potremmo prendere in considerazione l'aggiunta del supporto per i file in futuro, se ci saranno casi d'uso convincenti.

### Ma posso copiare il testo segreto. Qual è la differenza?

Vero, ma tutto ciò che hai è testo. Le immagini e altri tipi di file possono contenere metadati e altre informazioni potenzialmente rivelatrici sul mittente o sul destinatario. Anche in questo caso, si tratta semplicemente di garantire che nessuna informazione privata venga condivisa al di fuori del destinatario previsto.

### Posso recuperare un segreto che è già stato condiviso?

No. Lo visualizziamo una volta e poi lo cancelliamo. Dopo di che, è sparito per sempre.

### Qual è la differenza tra l'uso anonimo e avere un account gratuito?

Gli utenti anonimi possono creare segreti che durano fino a 7 giorni e hanno una dimensione massima di 100 KB. I titolari di un account gratuito ottengono vantaggi estesi: i segreti possono durare fino a 14 giorni e avere dimensioni fino a 1000 KB. I titolari di account hanno inoltre accesso a funzionalità aggiuntive come le opzioni di distruzione prima della lettura, che consentono ai mittenti di eliminare i segreti prima che vengano ricevuti.

### Come gestite le richieste di dati da parte delle forze dell'ordine o di altre terze parti?

Fedeli alle nostre radici, [il nostro codice resta open source](https://github.com/onetimesecret/onetimesecret) su GitHub. Mentre navighiamo nel panorama in evoluzione della privacy e della sicurezza digitale, siamo impegnati nella trasparenza e nel miglioramento continuo.

Abbiamo progettato il nostro sistema tenendo conto della privacy. Non memorizziamo i segreti dopo che sono stati visualizzati e non conserviamo i registri di accesso oltre il minimo necessario. Ciò significa che nella maggior parte dei casi non abbiamo semplicemente dati da fornire in risposta a tali richieste. Per maggiori dettagli, consulta la nostra [informativa sulla privacy](/privacy).

### Perché dovrei fidarmi di voi?

Abbiamo progettato il nostro sistema con la privacy e la sicurezza come priorità assolute. Ecco perché puoi fidarti di noi:

- Non possiamo accedere alle tue informazioni anche se volessimo (cosa che non vogliamo). Ad esempio, se condividi una password, non conosciamo il nome utente e nemmeno l'applicazione a cui si riferisce.
- Se utilizzi una passphrase (disponibile sotto "Opzioni privacy"), la includiamo nella chiave di crittografia del segreto. Memorizziamo solo un hash bcrypt della passphrase, rendendo impossibile per noi decrittografare il tuo segreto una volta salvato.
- Il nostro codice è [open source](https://github.com/onetimesecret/onetimesecret). Puoi esaminarlo tu stesso o persino eseguire la tua istanza, se preferisci.
- Utilizziamo pratiche di sicurezza standard del settore, tra cui HTTPS per tutte le connessioni e crittografia a riposo per i dati memorizzati.

### Come funziona l'opzione passphrase?

Quando utilizzi una passphrase, crittografiamo il tuo segreto sui nostri server usando la passphrase che fornisci. Non memorizziamo la passphrase stessa, ma solo un hash bcrypt. Questo hash viene utilizzato per verificare la passphrase quando il destinatario la inserisce. Ecco perché è sicuro:

- Non memorizziamo mai il segreto non crittografato o la passphrase.
- L'hash bcrypt non può essere utilizzato per decrittografare il segreto.
- Senza la passphrase originale, il segreto crittografato non può essere decrittografato, nemmeno da noi.
- Ciò significa che anche se i nostri server fossero compromessi, il tuo segreto rimarrebbe sicuro finché la passphrase rimane sconosciuta.

> **Ricorda**: la sicurezza del tuo segreto dipende dalla forza della tua passphrase e dalla sicurezza con cui la comunichi al destinatario.
