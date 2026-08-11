export interface Entry {
  label: string;
  description: string;
  code?: string;
  example?: string;
}

export interface Topic {
  id: string;
  title: string;
  layout: "liste" | "tabelle";
  entries: Entry[];
}

export const topics: Topic[] = [
  // =====================================================================
  {
    id: "1",
    title: "Route komplett",
    layout: "liste",
    entries: [
      {
        label: "Die Anatomie — jede Route sieht so aus",
        description:
          "Sechs Abschnitte, immer in dieser Reihenfolge. Nur die Prüfungen und die Aktion in der Mitte ändern sich. Wenn du nicht weiterweißt: dieses Gerüst hinschreiben und Stück für Stück füllen.",
        code: `router.delete("/:id", requireAuth, async (req, res) => {
  // 1 — AUSPACKEN: was kommt von außen rein?
  const userId = req.userId;              // aus der Middleware
  const id = Number(req.params.id);       // aus der URL, kommt als Text

  // 2 — GUARDS ohne Datenbank (billig, deshalb zuerst)
  if (!userId) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Ungültige ID" });
  }

  // 3 — TRY beginnt, wo die Datenbank ins Spiel kommt
  try {
    // 4 — HOLEN und prüfen (Existenz + Ownership)
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task || task.userId !== userId) {
      return res.status(404).json({ error: "Task nicht gefunden" });
    }

    // 5 — AKTION: ab hier ist alles geprüft und sicher
    await prisma.task.delete({ where: { id } });

    // 6 — ANTWORT
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "Reihenfolge der Prüfungen",
        description:
          "Von grob nach fein, billig vor teuer. 1) Eingeloggt? → 401. 2) Eingabe gültig? → 400. 3) Existiert der Datensatz? → 404. 4) Gehört er mir? → 404. 5) Erst jetzt die Aktion. Die ersten beiden brauchen keine Datenbank — wenn die ID sowieso Müll ist, musst du die DB gar nicht erst fragen.",
      },
      {
        label: "router.METHODE(pfad, middleware, handler)",
        description:
          "Die Route besteht aus drei Teilen: dem Pfad, optionaler Middleware und der Handler-Funktion. Der Doppelpunkt im Pfad macht einen Platzhalter — /:id passt auf /5, /42, /abc. Was da stand, findest du in req.params.id. Der Handler ist async, weil du drin await brauchst.",
        code: `router.get("/", ...)          // GET  /tasks
router.get("/:id", ...)       // GET  /tasks/5
router.post("/", ...)         // POST /tasks
router.patch("/:id", ...)     // PATCH /tasks/5
router.delete("/:id", ...)    // DELETE /tasks/5`,
      },
      {
        label: "Woher kommen die Daten? params / body / query",
        description:
          "Drei Quellen, drei Zwecke. req.params kommt aus dem Pfad und ist IMMER ein String — deshalb Number() drumherum. req.body ist der JSON-Inhalt bei POST/PUT/PATCH; damit der ankommt, braucht die App express.json(). req.query sind die Parameter hinter dem Fragezeichen, gut für Filter und Suche.",
        code: `// GET /tasks/5?done=true   mit Body { "title": "Neu" }

req.params.id      // "5"      — aus dem Pfad, immer String
req.query.done     // "true"   — hinter dem ?, immer String
req.body.title     // "Neu"    — der JSON-Body

// Auspacken per Destructuring:
const { title, content } = req.body;`,
      },
      {
        label: "Was requireAuth macht",
        description:
          "Middleware läuft VOR dem Handler. Sie liest den Token aus dem Authorization-Header, prüft ihn und hängt die userId an den Request. Danach ruft sie next() auf — erst dadurch läuft deine Route weiter. Ohne next() hängt der Request. Ist der Token ungültig, antwortet die Middleware selbst mit 401 und der Handler wird nie erreicht.",
        code: `export function requireAuth(req, res, next) {
  const header = req.headers.authorization;      // "Bearer eyJhbGci..."

  if (!header) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  const token = header.split(" ")[1];            // das "Bearer " abschneiden

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;                 // ab jetzt in der Route verfügbar
    next();                                      // weiter zum Handler
  } catch {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }
}`,
      },
      {
        label: "Warum async bei jeder Route",
        description:
          "await funktioniert nur innerhalb einer async-Funktion. Da praktisch jede Route mit der Datenbank spricht, ist async der Normalfall. Vergisst du es, unterstreicht TypeScript das await rot.",
        code: `router.get("/", requireAuth, async (req, res) => { ... });
//                              ^^^^^ ohne das kein await`,
      },
      {
        label: "Route registrieren",
        description:
          "Der Router allein tut nichts — er muss in der App eingehängt werden. Das Präfix steht dort, nicht in der Route selbst. Deshalb schreibst du in der Route nur '/' und '/:id'.",
        code: `// server.ts
app.use(express.json());              // JSON-Body überhaupt lesen können
app.use("/tasks", taskRouter);        // Präfix für alle Routen im Router
app.use("/categories", categoryRouter);`,
      },
    ],
  },

  // =====================================================================
  {
    id: "2",
    title: "REST-Methoden",
    layout: "tabelle",
    entries: [
      {
        label: "GET",
        description: "Daten holen, nichts verändern. Antwortet mit 200.",
        example: "Alle Tasks anzeigen",
      },
      {
        label: "POST",
        description: "Etwas Neues erstellen. Antwortet mit 201 Created.",
        example: "Neue Task anlegen",
      },
      {
        label: "PUT",
        description:
          "Etwas Bestehendes komplett ersetzen. Alle Felder werden mitgeschickt.",
        example: "Task bearbeiten",
      },
      {
        label: "PATCH",
        description:
          "Etwas Bestehendes teilweise ändern. Nur die Felder, die sich ändern.",
        example: "Nur done umschalten",
      },
      {
        label: "DELETE",
        description: "Etwas löschen. Antwortet mit 204 (kein Body).",
        example: "Task löschen",
      },
    ],
  },

  // =====================================================================
  {
    id: "3",
    title: "Statuscodes",
    layout: "tabelle",
    entries: [
      {
        label: "200",
        description: "OK — hat geklappt, Daten kommen mit",
        example: "GET, PATCH, PUT",
      },
      {
        label: "201",
        description: "Created — hat geklappt UND etwas Neues wurde angelegt",
        example: "POST",
      },
      {
        label: "204",
        description: "No Content — hat geklappt, es gibt nichts zurückzugeben",
        example: "DELETE",
      },
      {
        label: "400",
        description: "Bad Request — die Eingabe ist falsch oder unvollständig",
        example: "Titel fehlt, ID ist keine Zahl",
      },
      {
        label: "401",
        description: "Unauthorized — nicht eingeloggt oder Token ungültig",
        example: "Kein Token im Header",
      },
      {
        label: "403",
        description: "Forbidden — eingeloggt, aber keine Berechtigung",
        example: "Bei fremden Daten lieber 404 nehmen",
      },
      {
        label: "404",
        description: "Not Found — gibt es nicht (oder nicht für dich)",
        example: "Fremde oder gelöschte Task",
      },
      {
        label: "409",
        description: "Conflict — kollidiert mit dem Bestand",
        example: "E-Mail schon registriert",
      },
      {
        label: "500",
        description: "Internal Server Error — bei uns ist was kaputt",
        example: "DB weg, unerwarteter Fehler",
      },
    ],
  },

  // =====================================================================
  {
    id: "4",
    title: "Guard Clauses",
    layout: "liste",
    entries: [
      {
        label: "Was es ist",
        description:
          "Eine Prüfung ganz am Anfang, die bei ungültigem Zustand sofort aussteigt — bevor irgendwas passiert. Türsteher: Wer die Bedingungen nicht erfüllt, kommt gar nicht erst rein. Weiter geht es nur, wenn die Prüfung DURCHGEHT.",
        code: `if (!userId) {
  return res.status(401).json({ error: "Nicht eingeloggt" });
}
//  ^        ^                  ^
//  |        |                  Meldung an den Client
//  |        raus hier — Rest der Funktion wird übersprungen
//  "wenn NICHT vorhanden"`,
      },
      {
        label: "Warum im Backend zwingend",
        description:
          "Alles was von außen kommt — URL, Body, Token — ist nicht vertrauenswürdig. Dein Frontend ist optional: Jeder kann mit Postman oder curl direkt DELETE /tasks/5 an deinen Server schicken, dein React kommt dabei nie vor. Alle Prüfungen, die nur im Formular stehen, sind damit umgangen. Frontend-Validierung ist Komfort für den Nutzer, Backend-Validierung ist Sicherheit.",
      },
      {
        label: "Der zweite Grund: flacher Code",
        description:
          "Ohne Guard Clauses landest du in einer if/else-Pyramide, in der die eigentliche Arbeit ganz innen versteckt ist. Der Trick ist immer derselbe: Bedingung umdrehen mit ! und früh raus. Ergebnis: alle Sonderfälle oben abgehandelt, der Normalfall unten und unverschachtelt.",
        code: `// VORHER — Pyramide
if (userId) {
  if (id) {
    if (task) {
      // die eigentliche Arbeit, drei Ebenen tief
    } else { ... }
  } else { ... }
} else { ... }

// NACHHER — Guard Clauses
if (!userId) return res.status(401).json({ error: "..." });
if (!id)     return res.status(400).json({ error: "..." });
if (!task)   return res.status(404).json({ error: "..." });

// die eigentliche Arbeit — ganz links, gut lesbar`,
      },
      {
        label: "return niemals vergessen",
        description:
          "Das ist die gefährlichste Stelle. Ohne return geht die Fehlerantwort zwar raus, aber die Funktion läuft trotzdem weiter: Sie löscht den Task, den sie eigentlich ablehnen wollte, und schickt danach eine ZWEITE Antwort. Express wirft dann 'Cannot set headers after they are sent'. Die Prüfung sieht im Code aus, als würde sie schützen — tut es aber nicht.",
        code: `// FALSCH
if (!userId) {
  res.status(401).json({ error: "Nicht eingeloggt" });
}
await prisma.task.delete({ where: { id } });   // läuft trotzdem!

// RICHTIG
if (!userId) {
  return res.status(401).json({ error: "Nicht eingeloggt" });
}`,
      },
      {
        label: "In einer normalen Funktion",
        description:
          "Ohne Express gibt es kein res. Dort brichst du mit throw ab. Der Fehler fliegt dann nach oben zum nächsten catch.",
        code: `function begruesse(name: string | undefined) {
  if (!name) {
    throw new Error("Ungültiger Name");
  }

  return "Hallo " + name;   // hier ist name garantiert ein string
}`,
      },
      {
        label: "Type Narrowing als Nebeneffekt",
        description:
          "Nach der Guard Clause weiß TypeScript, dass der Wert nicht mehr undefined oder null sein kann — die Funktion käme sonst gar nicht bis dahin. Deshalb darfst du danach ohne ? damit arbeiten. Fahr mit der Maus über die Variable, dann siehst du den engeren Typ. Dasselbe Prinzip wie bei && im JSX.",
        code: `const task = await prisma.task.findUnique({ where: { id } });
// task ist hier:  Task | null

if (!task) {
  return res.status(404).json({ error: "Nicht gefunden" });
}

// task ist ab hier:  Task     — kein ?. mehr nötig
console.log(task.title);`,
      },
      {
        label: "404 statt 403 bei fremden Daten",
        description:
          "403 würde bedeuten 'existiert, gehört dir aber nicht' — damit verrätst du, dass die ID echt ist. Ein Angreifer könnte IDs durchprobieren und herausfinden, was existiert. 404 sagt schlicht 'gibt es nicht für dich'. Gleiches Prinzip wie die generische Meldung beim Login: nach außen so wenig verraten wie möglich.",
        code: `// Existenz und Ownership in EINER Prüfung — beides ergibt 404
if (!task || task.userId !== userId) {
  return res.status(404).json({ error: "Task nicht gefunden" });
}`,
      },
      {
        label: "!id vs Number.isNaN(id) — Fallstrick",
        description:
          "Number('abc') ergibt NaN, und !NaN ist true — das fängt der einfache Check. ABER: Number('0') ergibt 0, und !0 ist ebenfalls true. Der Guard würde die ID 0 ablehnen, obwohl sie gültig sein könnte. Bei Prisma-Autoincrement fängt die Zählung bei 1 an, also folgenlos — sauberer ist trotzdem der explizite Check. Derselbe Fallstrick wie || vs ??.",
        code: `if (!id) { ... }                 // lehnt auch 0 ab
if (Number.isNaN(id)) { ... }    // prüft genau das, was gemeint ist`,
      },
    ],
  },

  // =====================================================================
  {
    id: "5",
    title: "try/catch & res",
    layout: "liste",
    entries: [
      {
        label: "Unterschied zu if/else",
        description:
          "if/else prüft eine Bedingung, die DU formuliert hast — du weißt vorher, wonach du suchst. try/catch fängt Fehler ab, die du NICHT vorhersehen kannst. Niemand schreibt if (datenbankIstOffline). Daraus folgt die Aufteilung: Guard Clause = erwartete Fehler. try/catch = unerwartete Fehler.",
      },
      {
        label: "Warum es das gibt",
        description:
          "Ein unbehandelter Fehler in Node bricht die Ausführung ab. Ohne catch bekommt der Client gar keine Antwort und hängt bis zum Timeout — im schlimmsten Fall stirbt der ganze Server, nicht nur dieser eine Request. Mit catch lebt der Server weiter und schickt eine ordentliche Fehlermeldung.",
      },
      {
        label: "Der Aufbau",
        description:
          "catch läuft NICHT immer. Geht im try alles glatt, wird der catch-Block komplett übersprungen — anders als bei if/else, wo immer genau ein Zweig läuft. Und was catch macht, wenn es zuschlägt: Es überspringt den REST des try-Blocks. Beendet wird die Funktion erst durch das return im catch.",
        code: `try {
  const task = await prisma.task.findUnique({ where: { id } });
  await prisma.task.delete({ where: { id } });   // wird übersprungen,
  return res.status(204).send();                 // wenn oben was wirft
} catch (error) {
  console.error(error);                          // Details für dich
  return res.status(500).json({ error: "Serverfehler" });
}`,
      },
      {
        label: "throw und catch sind ein Paar",
        description:
          "throw wirft einen Fehler, catch fängt ihn — und das funktioniert über Funktionsgrenzen hinweg. Prisma wirft intern einen Fehler, dein catch fängt ihn, obwohl du den Code von Prisma nie gesehen hast.",
      },
      {
        label: "await braucht try",
        description:
          "await wartet auf ein Ergebnis, das später kommt. Geht das Warten schief, wirft await den Fehler. Deshalb steht im Backend fast jeder await-Aufruf in einem try-Block. Und deshalb beginnt das try genau da, wo die Datenbank ins Spiel kommt — die Guards davor brauchen es nicht.",
      },
      {
        label: "return vs res — der wichtigste Unterschied",
        description:
          "return beendet die Funktion. res beantwortet den Request. Eine Express-Route gibt nichts an einen Aufrufer zurück, denn es gibt keinen — der Client sitzt am anderen Ende einer HTTP-Verbindung, nicht in deinem Code. Mit return task passiert nichts: Express ignoriert den Wert, der Request hängt. Bei return res.json(task) macht das res die Arbeit, das return sorgt nur dafür, dass danach nichts mehr läuft.",
        code: `return task;                    // ❌ Client bekommt nie eine Antwort
return res.json(task);          // ✅

// Die res-Methoden:
res.json(daten)                 // Daten als JSON
res.status(201).json(daten)     // mit Statuscode
res.status(204).send()          // ohne Body
// res.log() gibt es NICHT — Loggen ist console.error`,
      },
      {
        label: "Loggen und Antworten sind getrennt",
        description:
          "console.error(error) schreibt ins Terminal, wo dein Server läuft — mit allen Details, für dich. Der Client bekommt eine generische Meldung. Echte Fehlertexte enthalten oft Interna: Tabellennamen, Spaltennamen, Dateipfade, manchmal Teile der Datenbank-URL. Das gehört nicht nach außen.",
        code: `// FALSCH
return res.status(500).json({ error: error.message });

// RICHTIG
console.error(error);
return res.status(500).json({ error: "Serverfehler" });`,
      },
      {
        label: "catch (error) ist unknown",
        description:
          "TypeScript gibt error den Typ unknown, weil theoretisch alles geworfen werden kann — nicht nur ein Error-Objekt. Willst du an die Nachricht ran, musst du erst prüfen. Für den Anfang reicht console.error(error).",
        code: `catch (error) {
  const nachricht = error instanceof Error ? error.message : "Unbekannt";
  console.error(nachricht);
  return res.status(500).json({ error: "Serverfehler" });
}`,
      },
    ],
  },

  // =====================================================================
  {
    id: "6",
    title: "Prisma",
    layout: "liste",
    entries: [
      {
        label: "Was ein ORM ist",
        description:
          "Deine Datenbank versteht nur SQL, dein Code ist TypeScript. Prisma ist der Übersetzer dazwischen: Du schreibst Objekte, Prisma baut daraus SQL, schickt es an die DB und gibt dir fertige JavaScript-Objekte zurück.",
        code: `// SQL
SELECT * FROM "Task" WHERE "userId" = 3;

// Prisma
await prisma.task.findMany({ where: { userId: 3 } });`,
      },
      {
        label: "Typsicherheit und prisma generate",
        description:
          "Prisma liest dein schema.prisma und generiert daraus TypeScript-Typen. Deshalb kennt VS Code deine Felder und schlägt sie vor, und ein Tippfehler im Spaltennamen fällt beim Schreiben auf statt erst zur Laufzeit. Genau deshalb musst du nach jeder Schema-Änderung generate laufen lassen — erst dann kennt TypeScript die neuen Felder.",
        code: `npx prisma migrate dev --name kategorie-hinzugefuegt
npx prisma generate
npx prisma studio     // DB im Browser ansehen`,
      },
      {
        label: "Warum await",
        description:
          "Die Datenbank liegt woanders, die Antwort dauert. Node wartet nicht untätig, sondern arbeitet weiter — der Prisma-Aufruf liefert deshalb sofort ein Promise zurück, einen Platzhalter für 'Ergebnis kommt noch'. await sagt: halt hier an, bis es da ist, dann pack es aus. Ohne await hast du nicht 'keine Daten', sondern ein Promise — und promise.title ist undefined, ohne dass etwas meckert. Genau deshalb ist ein vergessenes await so tückisch.",
        code: `const tasks = prisma.task.findMany();          // ❌ ein Promise
const tasks = await prisma.task.findMany();    // ✅ das Array

// await geht nur in async-Funktionen:
router.get("/", requireAuth, async (req, res) => { ... });`,
      },
      {
        label: "where vs data",
        description:
          "where = suchen. data = schreiben. create braucht nur data (beim Anlegen gibt es noch nichts zu suchen), delete nur where, update beides. Wenn du unsicher bist, welche Methode: Frag dich, ob du etwas Bestehendes brauchst. Wenn nein, ist es create.",
        code: `await prisma.task.update({
  where: { id: 5 },        // WELCHER Datensatz
  data: { done: true },    // WAS reinschreiben
});`,
      },
      {
        label: "Lesen: findMany",
        description:
          "Holt mehrere Datensätze. Gibt ein Array zurück — bei keinem Treffer ein leeres, nie null und nie ein Fehler. orderBy sortiert, take begrenzt die Anzahl.",
        code: `const tasks = await prisma.task.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
  take: 20,
});

return res.json(tasks);`,
      },
      {
        label: "Lesen: findUnique vs findFirst",
        description:
          "findUnique darf nur nach Feldern suchen, die in der DB als eindeutig markiert sind — id, oder email mit @unique. Dafür ist es schneller, weil die DB einen Index nutzen kann. findFirst kann nach allem suchen und nimmt bei mehreren Treffern den ersten. Beide geben null zurück, wenn nichts passt.",
        code: `// nur über eindeutige Felder
const task = await prisma.task.findUnique({ where: { id } });
const user = await prisma.user.findUnique({ where: { email } });

// beliebige Bedingung
const offen = await prisma.task.findFirst({
  where: { userId, done: false },
});`,
      },
      {
        label: "Anlegen: create",
        description:
          "Braucht nur data. Beim Anlegen gibt es noch keine ID — die vergibt die Datenbank. Gibt den neu angelegten Datensatz inklusive ID zurück, deshalb kannst du ihn direkt zurückschicken. Antwort ist 201.",
        code: `const task = await prisma.task.create({
  data: { title, userId },      // Kurzschreibweise für title: title
});

return res.status(201).json(task);`,
      },
      {
        label: "Ändern: update",
        description:
          "Braucht where und data. Gibt den geänderten Datensatz zurück. Wichtig: Wirft einen Fehler, wenn nichts gefunden wird — deshalb vorher findUnique.",
        code: `const aktualisiert = await prisma.task.update({
  where: { id },
  data: { done: !task.done },   // umschalten
});

return res.json(aktualisiert);`,
      },
      {
        label: "Löschen: delete",
        description:
          "Braucht nur where. Wirft ebenfalls, wenn nichts gefunden wird. Antwort ist 204 ohne Body — es gibt nichts mehr zurückzugeben.",
        code: `await prisma.task.delete({ where: { id } });

return res.status(204).send();`,
      },
      {
        label: "WICHTIG: Was passiert, wenn nichts gefunden wird",
        description:
          "Der Fallstrick, der alles mit den Guard Clauses verbindet. findMany gibt [], findUnique und findFirst geben null — beide werfen NICHT. update und delete dagegen werfen einen Fehler. Deshalb funktioniert if (!task) überhaupt, und deshalb machst du IMMER erst findUnique und dann update/delete.",
        code: `findMany     → []      kein Fehler
findUnique   → null    kein Fehler
findFirst    → null    kein Fehler
update       → wirft
delete       → wirft`,
      },
      {
        label: "Warum erst findUnique, dann delete",
        description:
          "Zwei Gründe. Erstens Ownership: Ohne findUnique weißt du nicht, wem der Datensatz gehört — jeder eingeloggte User könnte DELETE /tasks/5 schicken und fremde Tasks löschen. Zweitens der Statuscode: Löschst du direkt und die ID existiert nicht, wirft Prisma, dein catch fängt es und antwortet 500. Aber 'gibt es nicht' ist kein Serverfehler, das ist ein 404. Deshalb hast du in diesen Routen zwei DB-Aufrufe statt einem.",
        code: `const task = await prisma.task.findUnique({ where: { id } });

if (!task || task.userId !== userId) {
  return res.status(404).json({ error: "Task nicht gefunden" });
}

await prisma.task.delete({ where: { id } });`,
      },
      {
        label: "Leeres Array ist kein 404",
        description:
          "Ein User ohne Tasks ist völlig normal, kein Fehlerfall. Du gibst [] zurück, das Frontend zeigt seinen Empty State. 404 ist nur richtig, wenn ein konkreter, angeforderter Datensatz nicht existiert.",
      },
      {
        label: "select und include",
        description:
          "select holt nur bestimmte Felder statt aller — nützlich, um Passwort-Hashes nie mitzuschicken. include lädt verknüpfte Daten mit; ohne das bekommst du nur die categoryId, nicht die Kategorie selbst. Das ist der Baustein, der deine Relationen nutzbar macht.",
        code: `// nur bestimmte Felder
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true },     // ohne password!
});

// verknüpfte Daten mitladen
const tasks = await prisma.task.findMany({
  where: { userId },
  include: { category: true },           // task.category.name nutzbar
});`,
      },
    ],
  },

  // =====================================================================
  {
    id: "7",
    title: "TS Datenmodell",
    layout: "liste",
    entries: [
      {
        label: "Erst Daten formen, dann anzeigen",
        description:
          "Die Form der Daten entscheidet, wie einfach die Anzeige wird. Liegen die Einträge im Thema, schreibst du thema.entries. Liegen sie außerhalb, musst du bei jedem Klick suchen. Deshalb immer in dieser Reihenfolge denken.",
      },
      {
        label: "Die Übersetzungsregel",
        description:
          "Sag den Satz laut und übersetz Wort für Wort. 'Mehrere X' wird zu X[]. 'Hat einen/eine/ein' wird eine normale Eigenschaft. 'Hat mehrere' wird ein Array als Eigenschaft. Das ist keine Kreativität, das ist Übersetzen.",
        code: `// "Ich habe mehrere Themen. Jedes Thema hat einen Titel
//  und hat mehrere Einträge."

interface Entry {          // ein Eintrag — Name im Singular
  label: string;
  description: string;
  code?: string;           // ? = darf fehlen
}

interface Topic {
  id: string;
  title: string;           // "hat einen Titel"
  entries: Entry[];        // "hat mehrere Einträge"
}`,
      },
      {
        label: "[] heißt immer nur Mehrzahl",
        description:
          "Entry ist ein Eintrag, Entry[] sind mehrere. Verschachteln ist nur das, was passiert, WENN du so ein Array als Eigenschaft in ein anderes Interface schreibst. Das [] selbst bedeutet nichts anderes als 'mehrere davon'.",
      },
      {
        label: "Verschachteln oder über IDs verbinden",
        description:
          "Verschachteln, wenn das Kind immer und nur zu einem Elternteil gehört und nie allein gebraucht wird. Über IDs, wenn es auch allein gebraucht wird oder zu mehreren gehört. In einer Datenbank MUSS man IDs nehmen — eine Tabellenzelle kann keine Liste speichern. Deshalb hat Task eine userId. In einer TS-Datei darf ein Objekt eine Liste enthalten.",
      },
      {
        label: "{ } vs [ ] beim Schreiben",
        description:
          "{ } ist ein Ding und bekommt Paare aus eigenschaft: wert. [ ] sind mehrere Dinge und bekommt nur nackte Werte ohne Namen. Jeder Eigenschaftsname braucht einen Doppelpunkt — egal ob danach Text, Zahl, { } oder [ ] kommt.",
        code: `const crusaders: Team = {        // = nicht vergessen
  name: "Crusaders",             // Komma, nicht Semikolon
  spieler: [                     // Doppelpunkt auch vor [
    { name: "Alex", nummer: 10 },
    { name: "Max", nummer: 7 },
  ],
};`,
      },
      {
        label: "Interface-Syntax vs Daten-Syntax",
        description:
          "Zwei verschiedene Sprachen, die nur ähnlich aussehen. Interface: keine Zuweisung, Trenner ist das Semikolon, nach dem Namen kommt ein Typ. Daten: = nötig, Trenner ist das Komma, nach dem Namen kommt ein Wert.",
      },
      {
        label: "Die Technik: folg dem Interface",
        description:
          "Beim Ausfüllen nichts ausdenken. Das Interface sagt dir Zeile für Zeile, was zu tun ist — von außen nach innen, Ebene für Ebene. Immer beide Klammern sofort hinschreiben und dann reingehen, dann vergisst du keine.",
      },
      {
        label: "Union-Type mit |",
        description:
          "Der senkrechte Strich heißt 'oder'. Nur die aufgezählten Werte sind erlaubt. Vorteil gegenüber string: Tippfehler fallen beim Schreiben auf, und VS Code schlägt die erlaubten Werte vor.",
        code: `layout: "liste" | "tabelle";
const [aktiv, setAktiv] = useState<Topic | null>(null);`,
      },
      {
        label: "number vs string",
        description:
          "Könntest du damit rechnen, vergleichen, sortieren? Dann number. Sieht aus wie eine Zahl, aber man rechnet nie damit — Postleitzahl, Telefonnummer? Dann string, sonst verschwinden führende Nullen.",
      },
    ],
  },

  // =====================================================================
  {
    id: "8",
    title: "React Grundlagen",
    layout: "liste",
    entries: [
      {
        label: ".map() — Liste anzeigen",
        description:
          "Wandelt um und gibt zurück: Objekt rein, JSX raus, gleiche Anzahl. Du schreibst nie Buttons von Hand, sondern beschreibst einmal, wie EIN Button aus EINEM Objekt entsteht. forEach gibt nichts zurück — deshalb funktioniert nur .map() im JSX.",
        code: `{topics.map((topic) => (
  <button key={topic.id} onClick={() => setAktiv(topic)}>
    {topic.title}
  </button>
))}

// => ( )  gibt direkt zurück
// => { }  braucht ein eigenes return, sonst bleibt die Liste leer`,
      },
      {
        label: "key — warum nicht der Index",
        description:
          "React zeichnet nicht alles neu, sondern vergleicht alt und neu. Dafür braucht es pro Element ein Erkennungsmerkmal. Der Index ist die POSITION, keine Eigenschaft des Dings: Löschst du das erste Element, rutschen alle anderen hoch, und für React sieht es aus, als hätte sich der Inhalt geändert statt dass eins verschwunden ist. Bei Buttons fällt das nicht auf, bei Eingabefeldern landen Werte in der falschen Zeile. Die id klebt am Objekt, der Index an der Position.",
      },
      {
        label: "useState — das Gedächtnis",
        description:
          "React zeichnet neu, indem es die Funktion komplett nochmal ausführt. Ein let wäre bei jedem Durchlauf wieder weg, und React würde gar nicht merken, dass sich etwas geändert hat. State löst beides: Der Wert überlebt das Neuzeichnen, und die Änderung löst es aus. Niemals direkt zuweisen — nur die set-Funktion sagt React 'zeichne neu'.",
        code: `const [aktivesThema, setAktivesThema] = useState<Topic | null>(null);
//     ^ lesen        ^ ändern                    ^ Typ      ^ Startwert`,
      },
      {
        label: "onClick will eine Funktion, keinen Aufruf",
        description:
          "Ohne () => wird die Funktion sofort ausgeführt, während React die Seite baut — nicht beim Klick. Ergebnis: Endlosschleife. Mit () => übergibst du eine Anleitung, die React aufhebt und erst beim Klick ausführt.",
        code: `onClick={() => setAktiv(topic)}    // ✅
onClick={setAktiv(topic)}          // ❌ läuft sofort`,
      },
      {
        label: "Ein return = ein Element",
        description:
          "Zwei Elemente nebeneinander ohne Umhüllung sind verboten. Wrapper nötig: ein <div> oder ein Fragment <>...</>.",
      },
      {
        label: "Einmal oder pro Element?",
        description:
          "Die wichtigste Frage bei JSX. Wo eine Zeile steht, entscheidet, wie oft sie gebaut wird: außerhalb von .map() einmal, innerhalb pro Element. Bei jedem JSX-Stück kurz fragen — die Antwort sagt dir, wo es hingehört.",
        code: `{aktiv && (
  <div>
    <h1>{aktiv.title}</h1>                  {/* EINMAL */}
    <button onClick={...}>Zurück</button>   {/* EINMAL */}

    {aktiv.entries.map((entry) => (
      <div key={entry.label}>               {/* PRO EINTRAG */}
        <h2>{entry.label}</h2>
      </div>
    ))}
  </div>
)}`,
      },
      {
        label: "&& vs ? :",
        description:
          "&& = ob überhaupt: zeig es, oder zeig nichts. Nur ein Ausgang. ? : = welches von beiden: zeig entweder das eine oder das andere. Innerhalb des && weiß TypeScript, dass der Wert nicht null ist — deshalb darfst du dort .entries schreiben.",
        code: `{aktiv && <div>...</div>}
{istTabelle ? <Tabelle /> : <Liste />}`,
      },
      {
        label: "?. und ??",
        description:
          "?. greift nur zu, wenn links nicht null ist — sonst kommt undefined statt einem Absturz. ?? liefert einen Ersatzwert, wenn links null oder undefined ist. Wichtig: ?? ist nicht dasselbe wie ||. Das || greift auch bei 0 und leerem Text, und das ist eine klassische Bugquelle.",
        code: `aktiv?.id                     // kein Absturz, wenn aktiv null ist
entry.example ?? "—"          // Ersatz nur bei null/undefined
entry.example || "—"          // greift auch bei "" und 0`,
      },
      {
        label: "import und export",
        description:
          "Jede Datei ist eine abgeschlossene Kiste. export ist die Erlaubnis, import die Anforderung — beides nötig. Die Dateiendung lässt du im Pfad weg, die ergänzt Vite. import type brauchst du bei strikter tsconfig für Interfaces, weil die nur zur Entwicklungszeit existieren und beim Bauen rausfliegen.",
        code: `import { topics, type Topic } from "./data/topics";`,
      },
      {
        label: "Daten gehören nicht in die Komponente",
        description:
          "Die Komponente soll Daten ANZEIGEN, nicht BESITZEN. Liegen sie in einer eigenen Datei, fasst du beim Ergänzen nur die Datendatei an und nie die Komponente.",
      },
    ],
  },
];
