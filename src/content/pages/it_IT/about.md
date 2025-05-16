---
title: Informazioni
---

<article class="prose dark:prose-invert md:prose-lg lg:prose-xl">
  <h2>
    Informazioni
  </h2>

  <p>
    Ciao, sono {nome}, il creatore di Onetime Secret. Quello che è iniziato nel 2012 come un modo semplice e sicuro per condividere informazioni sensibili è cresciuto oltre le nostre più rosee aspettative. Più di dieci anni dopo, stiamo facilitando la condivisione sicura di milioni di segreti al mese, con casi d'uso che non avremmo mai immaginato
  </p>

  <p>
    La prima metà del 2024 è stato il nostro periodo più intenso. Siamo grati che le persone abbiano continuato a usare e condividere il nostro prodotto per più di un decennio. Attualmente stiamo lavorando a miglioramenti che pensiamo renderanno il servizio ancora più utile - condivideremo presto maggiori dettagli.
  </p>

  <p>
    Fedeli alle nostre radici, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> su GitHub. Mentre navighiamo nel panorama in evoluzione della privacy e della sicurezza digitale, siamo impegnati nella trasparenza e nel miglioramento continuo.
  </p>

  <p>
    Grazie per aver fatto parte del nostro viaggio. Brindiamo a un altro decennio di condivisione sicura ed effimera
  </p>

  <p>
    Se avete domande, c'è un modulo di feedback in fondo a (quasi) ogni pagina
  </p>

  <p>
    Buona condivisione, n{n{nome}
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

  <h4>Perché dovrei usarlo?</h4>
  <p>
    Quando si inviano alle persone password e link privati via e-mail o chat, ci sono copie di tali informazioni memorizzate in molti luoghi. Se invece si utilizza un link Onetime, le informazioni permangono per una singola visualizzazione, il che significa che non possono essere lette da qualcun altro in seguito. Ciò consente di inviare informazioni sensibili in modo sicuro, sapendo che saranno viste da una sola persona. È come un messaggio che si autodistrugge
  </p>

  <h4>Perché non posso inviare immagini o altri tipi di file?</h4>
  <p>
    Il nostro servizio è stato progettato specificamente per i segreti basati sul testo per garantire la massima sicurezza e semplicità. I file, soprattutto le immagini, possono contenere metadati che potrebbero involontariamente rivelare informazioni sul mittente o sul destinatario. Concentrandoci sul testo, possiamo garantire che non vengano trasmessi altri dati oltre a quelli digitati esplicitamente. Se avete bisogno di condividere un file in modo sicuro, vi consigliamo di utilizzare un servizio di trasferimento sicuro di file dedicato. Potremmo prendere in considerazione l'aggiunta del supporto per i file in futuro, se ci sono casi d'uso convincenti.
  </p>

  <h4>Ma posso copiare il testo segreto. Qual è la differenza?</h4>
  <p>
    È vero, ma tutto ciò che hai è testo. Le immagini e altri tipi di file possono contenere metadati e altre informazioni potenzialmente rivelatrici sul mittente o sul destinatario. Anche in questo caso, si tratta semplicemente di garantire che nessuna informazione privata venga condivisa al di fuori del destinatario.
  </p>

  <h4>Posso recuperare un segreto che è già stato condiviso?</h4>
  <p>
    No. Lo visualizziamo una volta e poi lo cancelliamo. Dopo di che, è sparito per sempre
  </p>

  <h4>Qual è la differenza tra l'uso anonimo e l'avere un account gratuito?</h4>
  <p>
    Gli utenti anonimi possono creare segreti che durano fino a 7 giorni e hanno una dimensione massima di 100. KB. I titolari di un account gratuito possono usufruire di vantaggi più ampi: i segreti possono durare fino a 14 giorni e avere dimensioni massime di 1000 KB. I titolari di account hanno inoltre accesso a funzioni aggiuntive come le opzioni di masterizzazione prima della lettura, che consentono ai mittenti di eliminare i segreti prima che vengano ricevuti.
  </p>

  <h4>Come gestite le richieste di dati da parte delle forze dell'ordine o di altre terze parti?</h4>
  <p>
    Fedeli alle nostre radici, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> su GitHub. Mentre navighiamo nel panorama in evoluzione della privacy e della sicurezza digitale, siamo impegnati nella trasparenza e nel miglioramento continuo.
  </p>
  <p>
    Abbiamo progettato il nostro sistema tenendo conto della privacy. Non memorizziamo i segreti dopo che sono stati visualizzati e non conserviamo i registri di accesso oltre il minimo necessario. Ciò significa che nella maggior parte dei casi non abbiamo alcun dato da fornire in risposta a tali richieste. Per maggiori dettagli, consultare la nostra <a href="/privacy">privacy policy</a>
  </p>

  <h4>Perché dovrei fidarmi di voi?</h4>
  <p>
    Abbiamo progettato il nostro sistema tenendo conto della privacy e della sicurezza come priorità assolute. Ecco perché puoi fidarti di noi:
  </p>
  <ul>
    <li>Non possiamo accedere alle tue informazioni anche se volessimo (cosa che non vogliamo). Ad esempio, se condividi una password, non conosciamo il nome utente o nemmeno l'applicazione a cui si riferisce.</li>
    <li>Se utilizzi una passphrase (disponibile sotto "Opzioni Privacy"), la includiamo nella chiave di crittografia per il segreto. Memorizziamo solo un hash bcrypt della passphrase, rendendo impossibile per noi decrittografare il tuo segreto una volta salvato.</li>
    <li>Il nostro codice è <a href="https://github.com/onetimesecret/onetimesecret">open source</a>. Puoi esaminarlo tu stesso o persino eseguire la tua istanza se preferisci.</li>
    <li>Utilizziamo pratiche di sicurezza standard del settore, tra cui HTTPS per tutte le connessioni e la crittografia a riposo per i dati memorizzati.</li>
  </ul>

  <h4>Come funziona l'opzione passphrase?</h4>
  <p>
    Quando si utilizza una passphrase, il segreto viene crittografato sui nostri server utilizzando la passphrase fornita. Non memorizziamo la passphrase stessa, ma solo un hash di bcrypt. Questo hash viene utilizzato per verificare la passphrase quando il destinatario la inserisce. Ecco perché è sicuro:
  </p>
  <ul>
    <li>Non memorizziamo mai il segreto non crittografato o la passphrase.</li>
    <li>L'hash bcrypt non può essere utilizzato per decrittografare il segreto.</li>
    <li>Senza la passphrase originale, il segreto crittografato non può essere decrittografato, nemmeno da noi.</li>
    <li>Ciò significa che anche se i nostri server fossero compromessi, il tuo segreto rimarrebbe sicuro finché la passphrase rimane sconosciuta.</li>
  </ul>
  <p>
    Ricordate, la sicurezza del vostro segreto dipende dalla forza della vostra passphrase e dalla sicurezza con cui la comunicate al destinatario
  </p>
</article>
