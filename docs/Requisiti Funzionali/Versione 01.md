- Questa deve essere una repo per una app web per contenere tool per la gestione di ttrpg
- Nella sua prima implementazione si occuperà solo di:
  - Dungeons e Dragons
  - Una app web che gira solo in locale
  - Sistema di reputazione tra personaggi

- Nella sua prima versione deve avere:
  - Una struttura semplice, incentrata su 
  - ottimizzare la velocità di implementazione
  - ridurre il debito tecnico
  - lasciarsi aperta a sviluppi futuri in ottica di estensibilità/modularità
  - una forte separazione tra 
    - logica backand/modellazione dati 
    - logia frontend/visulliazzazione dati
  - Preferisco concentrarmi sul backend nei primi sviluppi
  - Nei primi sviluppi non vorrei adottare framework vari ma limitarmi a JS, CSS, HTML
  - Appena ti accorgi che un framework possa migliorare lo sviluppo faccelo presente

- Nei primi sviluppi l'app dovrà
- girare nel browser
- salvare i dati in un json o nel motere di ricerca coockie o altre cose, dimmi tu
- prevedere una sorta di bottone per fare un dump dei dati in un formato agevole tipo json credo, dimmi tu se c'è altro di miglioire
- un modo agile per reimportatre/popolare l'app coi dati precedentemente dumpati
- Quindi la logica/il sistema di dowload/ricarica dati e una cosa su cui vorrei concentrarmi

- probabilmente nel futuro i modelli backend li vorrò spostare in python, quindi dimmi se ha senso tenere in considerazione già questa cosa quando in queesta fase progettiamo un prototipo di modernizzazione dati in js

- Funzionalità da implementare nello step 1: Sistema di reputazione tra personaggi
- Il modello character (personaggio) che ha campi come:
  - nome
  - livello di relazione da 1 a 100 con un altro character, e quindi questo campo è biunivoco
- deve prevedere la possibilità di insere nuovi personaggi
- appena si aggiunge un nuovo personaggio, il suo livello di relazione nasce a 50 con tutti i personaggi esistenti
- questo punteggio di relazione può essere modificato solamente inserendo una transazione che aumenta o diminuisce il punteggio di relazione
- questa transazione relazionale ha un numero (negativo/positivo) e un nome
- mettere la possibilta che cliccando sul punteggio di una relazione di vedere da che transazioni è compèosta quella relazione e la possibilita di aggiungerne altre e modificare/eliminarne altre
