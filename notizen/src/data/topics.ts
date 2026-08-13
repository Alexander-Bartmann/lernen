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
  // Route komplett===================================================================
  {
    id: "route",
    title: "Route komplett",
    layout: "liste",
    entries: [
      {
        label: "Die 6 Fragen — das Grundmuster",
        description:
          "Jede Route beantwortet dieselben sechs Fragen. Nur die Antworten ändern sich. Wenn du nicht weiterweißt: diese Liste durchgehen, dann steht die Route. 1) Was kommt rein? 2) Ist es gültig? 3) Was brauche ich aus der DB? 4) Darf ich das? 5) Was tue ich? 6) Was antworte ich? Bei POST fallen 3 und 4 oft weg (es gibt noch nichts zu holen), bei GET fällt 4 weg.",
      },
      {
        label: "GET — Liste holen (die einfachste Route)",
        description:
          "Keine ID, kein Body, kein Ownership-Check. Nur: eingeloggt? Dann alles holen, was dem User gehört. Ein leeres Array ist KEIN Fehler — ein User ohne Tasks ist normal.",
        code: `app.get("/tasks", requireAuth, async (req, res) => {
  // 1 — auspacken
  const userId = req.userId;

  // 2 — Guard
  if (!userId) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  // 3 — holen + antworten
  try {
    const tasks = await prisma.task.findMany({ where: { userId } });
    return res.json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "POST — neu anlegen",
        description:
          "Hier kommt ein Body rein, also braucht es Zod. Kein findUnique nötig — es gibt ja noch nichts zu suchen. Deshalb auch nur data bei Prisma, kein where. Antwort ist 201.",
        code: `app.post("/tasks", requireAuth, async (req, res) => {
  // 1 + 2 — Body prüfen (Zod), DANN erst der Rest
  const result = taskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  // 5 + 6 — anlegen + antworten
  try {
    const newTask = await prisma.task.create({
      data: {
        ...result.data,      // alle geprüften Felder aus dem Body
        done: false,         // Standardwert
        userId,              // wem gehört es
      },
    });
    return res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "PATCH — ein Feld ändern (z. B. done umschalten)",
        description:
          "Jetzt ist eine ID im Spiel. Also: ID auspacken, prüfen, Datensatz holen, Ownership prüfen, DANN ändern. Der Datensatz muss vorher geholt werden, weil du den alten Wert brauchst, um ihn umzudrehen.",
        code: `app.patch("/tasks/:id", requireAuth, async (req, res) => {
  // 1 — auspacken
  const userId = req.userId;
  const id = req.params.id;

  // 2 — Guards
  if (!userId) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }
  if (!id) {
    return res.status(400).json({ error: "Ungültige ID" });
  }

  try {
    // 3 + 4 — holen und prüfen: existiert es und gehört es mir?
    const task = await prisma.task.findUnique({ where: { id, userId } });
    if (!task) {
      return res.status(404).json({ error: "Task nicht gefunden" });
    }

    // 5 + 6 — ändern + antworten
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { done: !task.done },
    });
    return res.json(updatedTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "PUT — alles überschreiben",
        description:
          "Wie PATCH, aber mit Body — also zusätzlich Zod ganz oben. Statt einem Feld wird der ganze Datensatz mit result.data ersetzt.",
        code: `app.put("/tasks/:id", requireAuth, async (req, res) => {
  const result = taskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }

  const userId = req.userId;
  const id = req.params.id;

  if (!userId) return res.status(401).json({ error: "Nicht eingeloggt" });
  if (!id)     return res.status(400).json({ error: "Ungültige ID" });

  try {
    const task = await prisma.task.findUnique({ where: { id, userId } });
    if (!task) {
      return res.status(404).json({ error: "Task nicht gefunden" });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: result.data,      // ALLE Felder ersetzen
    });
    return res.json(updatedTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "DELETE — löschen",
        description:
          "Wie PATCH, nur ohne Body und ohne Zod. Erst holen und Ownership prüfen, dann löschen. Antwort ist 204 — es gibt nichts zurückzugeben.",
        code: `app.delete("/tasks/:id", requireAuth, async (req, res) => {
  const userId = req.userId;
  const id = req.params.id;

  if (!userId) return res.status(401).json({ error: "Nicht eingeloggt" });
  if (!id)     return res.status(400).json({ error: "Ungültige ID" });

  try {
    const task = await prisma.task.findUnique({ where: { id, userId } });
    if (!task) {
      return res.status(404).json({ error: "Task nicht gefunden" });
    }

    await prisma.task.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "Woher kommen die Daten? params / body / query",
        description:
          "Drei Quellen. req.params ist der Platzhalter aus dem Pfad und IMMER ein Text. req.body ist der JSON-Inhalt bei POST/PUT/PATCH — dafür braucht die App express.json(). req.query steht hinter dem Fragezeichen, gut für Filter und Suche.",
        code: `// GET /tasks/5?done=true   mit Body { "title": "Neu" }

req.params.id      // "5"      aus dem Pfad
req.query.done     // "true"   hinter dem ?
req.body.title     // "Neu"    der JSON-Body

// mehrere auf einmal auspacken:
const { title, text } = req.body;

// bei Zahlen-IDs umwandeln (bei Text-IDs wie cuid NICHT nötig):
const id = Number(req.params.id);`,
      },
      {
        label: ":id im Pfad und req.params gehören zusammen",
        description:
          "Steht :id im Pfad, musst du req.params.id im Handler auspacken und prüfen. Fehlt der Platzhalter im Pfad, ist req.params.id undefined — und dann bleibt jeder Request am Guard hängen.",
        code: `app.patch("/tasks/:id", ...)     // Platzhalter im Pfad
const id = req.params.id;        // auspacken
if (!id) { ... }                 // prüfen`,
      },
      {
        label: "Server-Grundgerüst",
        description:
          "Ohne express.json() bleibt req.body leer. Ohne cors() blockiert der Browser Anfragen von deinem Frontend, weil es auf einem anderen Port läuft. app.listen() startet den Server und steht ganz unten.",
        code: `import express from "express";
import cors from "cors";
import { prisma } from "./db.js";

const app = express();

app.use(express.json());   // JSON-Body lesen können
app.use(cors());           // Frontend darf zugreifen

app.get("/", (req, res) => {
  res.send("Server läuft");
});

// ... deine Routen ...

app.listen(3000);`,
      },
    ],
  },

  // Guard Clauses===================================================================
  {
    id: "guards",
    title: "Guard Clauses",
    layout: "liste",
    entries: [
      {
        label: "Was es ist",
        description:
          "Ein Türsteher am Anfang der Funktion. Passt etwas nicht, ist sofort Schluss — der Rest läuft gar nicht erst. Weiter geht es NUR, wenn die Prüfung durchgeht.",
        code: `if (!userId) {
  return res.status(401).json({ error: "Nicht eingeloggt" });
}
//  ^ "wenn NICHT vorhanden"
//         ^ raus hier, Rest wird übersprungen`,
      },
      {
        label: "Warum im Backend Pflicht",
        description:
          "Dein Frontend ist optional. Jeder kann mit Postman direkt DELETE /tasks/5 an deinen Server schicken — dein React kommt dabei nie vor. Alles, was nur im Formular geprüft wird, ist damit umgangen. Frontend-Prüfung = Komfort. Backend-Prüfung = Sicherheit.",
      },
      {
        label: "return NIEMALS vergessen",
        description:
          "Der gefährlichste Fehler. Ohne return geht die Fehlermeldung zwar raus, aber die Funktion läuft weiter, macht die Aktion trotzdem und schickt eine zweite Antwort. Express wirft dann 'Cannot set headers after they are sent'. Die Prüfung sieht aus, als würde sie schützen — tut es aber nicht.",
        code: `// FALSCH
if (!userId) {
  res.status(401).json({ error: "..." });
}
await prisma.task.delete({ where: { id } });   // läuft trotzdem!

// RICHTIG
if (!userId) {
  return res.status(401).json({ error: "..." });
}`,
      },
      {
        label: "Reihenfolge: billig vor teuer",
        description:
          "1) Eingeloggt? → 401. 2) Eingabe gültig? → 400. 3) Existiert es? → 404. 4) Gehört es mir? → 404. 5) Erst dann die Aktion. Die ersten beiden brauchen keine Datenbank. Wenn die ID sowieso Müll ist, musst du die DB gar nicht erst fragen.",
      },
      {
        label: "Flacher Code statt Pyramide",
        description:
          "Ohne Guards versteckt sich die eigentliche Arbeit drei Ebenen tief. Der Trick ist immer derselbe: Bedingung umdrehen mit ! und früh raus.",
        code: `// VORHER
if (userId) {
  if (id) {
    if (task) {
      // die Arbeit, ganz tief drin
    } else { ... }
  } else { ... }
} else { ... }

// NACHHER
if (!userId) return res.status(401).json({ error: "..." });
if (!id)     return res.status(400).json({ error: "..." });
if (!task)   return res.status(404).json({ error: "..." });

// die Arbeit — ganz links, gut lesbar`,
      },
      {
        label: "404 statt 403 bei fremden Daten",
        description:
          "403 würde heißen 'existiert, gehört dir aber nicht' — damit verrätst du, dass die ID echt ist. Jemand könnte IDs durchprobieren. 404 sagt einfach 'gibt es nicht für dich'.",
        code: `// Existenz und Ownership in EINER Prüfung
if (!task || task.userId !== userId) {
  return res.status(404).json({ error: "Task nicht gefunden" });
}`,
      },
      {
        label: "Type Narrowing — der Nebeneffekt",
        description:
          "Nach der Guard Clause weiß TypeScript, dass der Wert nicht mehr null sein kann. Die Funktion käme ja sonst gar nicht bis dahin. Deshalb darfst du danach ohne ? damit arbeiten.",
        code: `const task = await prisma.task.findUnique({ where: { id } });
// task ist hier:  Task | null

if (!task) {
  return res.status(404).json({ error: "Nicht gefunden" });
}

// task ist ab hier:  Task   — kein ?. nötig
console.log(task.title);`,
      },
      {
        label: "In einer normalen Funktion: throw",
        description:
          "Ohne Express gibt es kein res. Dort brichst du mit throw ab. Der Fehler fliegt dann nach oben zum nächsten catch.",
        code: `function begruesse(name: string | undefined) {
  if (!name) {
    throw new Error("Ungültiger Name");
  }
  return "Hallo " + name;
}`,
      },
      {
        label: "Fallstrick: ! bei Zahlen",
        description:
          "! behandelt 0 und leeren Text wie 'nicht vorhanden'. Bei Zahlen-IDs deshalb lieber explizit prüfen. Derselbe Fallstrick wie || gegen ??.",
        code: `if (!id) { ... }                 // lehnt auch die 0 ab
if (Number.isNaN(id)) { ... }    // prüft genau das Gemeinte`,
      },
    ],
  },

  // try/catch & res===================================================================
  {
    id: "trycatch",
    title: "try/catch & res",
    layout: "liste",
    entries: [
      {
        label: "Unterschied zu if/else",
        description:
          "if/else prüft etwas, das DU dir überlegt hast — du weißt vorher, wonach du suchst. try/catch fängt Fehler ab, die du nicht vorhersehen kannst. Niemand schreibt if (datenbankIstOffline). Kurz: Guard Clause = erwartete Fehler. try/catch = unerwartete.",
      },
      {
        label: "Der Aufbau",
        description:
          "catch läuft NICHT immer — geht im try alles gut, wird es komplett übersprungen. Schlägt es zu, wird der REST des try übersprungen. Beendet wird die Funktion erst durch das return im catch.",
        code: `try {
  const task = await prisma.task.findUnique({ where: { id } });
  await prisma.task.delete({ where: { id } });   // wird übersprungen,
  return res.status(204).send();                 // wenn oben was schiefgeht
} catch (error) {
  console.error(error);
  return res.status(500).json({ error: "Serverfehler" });
}`,
      },
      {
        label: "Warum es das braucht",
        description:
          "Ein unbehandelter Fehler bricht die Ausführung ab. Ohne catch bekommt der Client gar keine Antwort und hängt — im schlimmsten Fall stirbt der ganze Server, nicht nur dieser eine Request.",
      },
      {
        label: "await braucht try",
        description:
          "await wartet auf etwas, das später kommt. Geht das schief, wirft await den Fehler. Deshalb steht fast jeder await-Aufruf in einem try — und deshalb beginnt das try genau da, wo die Datenbank ins Spiel kommt. Die Guards davor brauchen es nicht.",
      },
      {
        label: "return vs res — der wichtigste Unterschied",
        description:
          "return beendet die Funktion. res beantwortet den Request. Eine Route gibt nichts an einen Aufrufer zurück, denn es gibt keinen — der Client sitzt am anderen Ende einer Internetverbindung. Mit return task passiert nichts, der Request hängt.",
        code: `return task;             // ❌ Client bekommt nie eine Antwort
return res.json(task);   // ✅

// Die res-Methoden:
res.json(daten)               // Daten als JSON
res.status(201).json(daten)   // mit Statuscode
res.status(204).send()        // ohne Inhalt
res.send("Text")              // reiner Text
// res.log() gibt es NICHT — Loggen ist console.error`,
      },
      {
        label: "Loggen und Antworten sind getrennt",
        description:
          "console.error schreibt ins Terminal, wo dein Server läuft — mit allen Details, für dich. Der Client bekommt eine allgemeine Meldung. Echte Fehlertexte verraten Tabellennamen, Dateipfade, manchmal Teile der Datenbank-Adresse.",
        code: `// FALSCH
return res.status(500).json({ error: error.message });

// RICHTIG
console.error(error);
return res.status(500).json({ error: "Serverfehler" });`,
      },
      {
        label: "throw und catch sind ein Paar",
        description:
          "throw wirft, catch fängt — auch über Dateigrenzen hinweg. Prisma wirft intern einen Fehler, dein catch fängt ihn, obwohl du den Prisma-Code nie gesehen hast.",
      },
      {
        label: "catch (error) ist unknown",
        description:
          "TypeScript weiß nicht, was geworfen wurde — theoretisch kann alles geworfen werden. Willst du an die Nachricht ran, musst du erst prüfen. Für den Anfang reicht console.error(error).",
        code: `catch (error) {
  const text = error instanceof Error ? error.message : "Unbekannt";
  console.error(text);
  return res.status(500).json({ error: "Serverfehler" });
}`,
      },
    ],
  },

  // Prisma===================================================================
  {
    id: "prisma",
    title: "Prisma",
    layout: "liste",
    entries: [
      {
        label: "Was ein ORM ist",
        description:
          "Die Datenbank versteht nur SQL, dein Code ist TypeScript. Prisma übersetzt: Du schreibst Objekte, Prisma baut daraus SQL und gibt dir fertige JavaScript-Objekte zurück.",
        code: `// SQL
SELECT * FROM "Task" WHERE "userId" = 3;

// Prisma
await prisma.task.findMany({ where: { userId: 3 } });`,
      },
      {
        label: "where vs data — die Grundregel",
        description:
          "where = suchen. data = schreiben. create braucht nur data (beim Anlegen gibt es noch nichts zu suchen), delete nur where, update beides.",
        code: `await prisma.task.update({
  where: { id },           // WELCHER Datensatz
  data: { done: true },    // WAS reinschreiben
});`,
      },
      {
        label: "findMany — mehrere holen",
        description:
          "Gibt ein Array zurück. Bei keinem Treffer ein leeres — nie null, nie ein Fehler. orderBy sortiert, take begrenzt die Anzahl.",
        code: `const tasks = await prisma.task.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },   // neueste zuerst
  take: 20,                         // maximal 20
});`,
      },
      {
        label: "findUnique / findFirst — einen holen",
        description:
          "findUnique sucht nur über eindeutige Felder (id, oder email mit @unique) — dafür schneller. findFirst darf nach allem suchen und nimmt den ersten Treffer. Beide geben null zurück, wenn nichts passt.",
        code: `const task = await prisma.task.findUnique({ where: { id } });
const user = await prisma.user.findUnique({ where: { email } });

// beliebige Bedingung:
const offen = await prisma.task.findFirst({
  where: { userId, done: false },
});`,
      },
      {
        label: "create — anlegen",
        description:
          "Nur data. Die ID vergibt die Datenbank selbst. Gibt den neuen Datensatz inklusive ID zurück, den kannst du direkt zurückschicken.",
        code: `const task = await prisma.task.create({
  data: { title, userId },
});
return res.status(201).json(task);`,
      },
      {
        label: "update — ändern",
        description:
          "where und data. Gibt den geänderten Datensatz zurück. Wirft einen Fehler, wenn nichts gefunden wird — deshalb vorher findUnique.",
        code: `const updated = await prisma.task.update({
  where: { id },
  data: { done: !task.done },   // umschalten
});`,
      },
      {
        label: "delete — löschen",
        description:
          "Nur where. Wirft ebenfalls, wenn nichts gefunden wird. Antwort ist 204 ohne Inhalt.",
        code: `await prisma.task.delete({ where: { id } });
return res.status(204).send();`,
      },
      {
        label: "WICHTIG: was passiert bei 'nicht gefunden'",
        description:
          "Der Punkt, der alles mit den Guard Clauses verbindet. Lesen wirft nie, Schreiben schon. Deshalb funktioniert if (!task) überhaupt — und deshalb machst du IMMER erst findUnique, dann update/delete.",
        code: `findMany     →  []      kein Fehler
findUnique   →  null    kein Fehler
findFirst    →  null    kein Fehler
update       →  wirft
delete       →  wirft`,
      },
      {
        label: "Warum erst suchen, dann löschen",
        description:
          "Zwei Gründe. Erstens Ownership: Ohne findUnique weißt du nicht, wem der Datensatz gehört — jeder Eingeloggte könnte fremde Tasks löschen. Zweitens der Statuscode: Direkt löschen bei nicht existierender ID gibt einen 500, obwohl es ein 404 sein müsste.",
      },
      {
        label: "Leeres Array ist kein 404",
        description:
          "Ein User ohne Tasks ist normal, kein Fehler. Du gibst [] zurück, das Frontend zeigt seinen Empty State. 404 ist nur richtig, wenn ein konkret angefragter Datensatz fehlt.",
      },
      {
        label: "select und include",
        description:
          "select holt nur bestimmte Felder — nützlich, um Passwörter nie mitzuschicken. include lädt verknüpfte Daten mit; ohne das bekommst du nur die categoryId, nicht die Kategorie selbst.",
        code: `// nur bestimmte Felder
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true },   // ohne password!
});

// verknüpfte Daten mitladen
const tasks = await prisma.task.findMany({
  where: { userId },
  include: { category: true },         // task.category.name nutzbar
});`,
      },
      {
        label: "Befehle im Terminal",
        description:
          "Nach jeder Schema-Änderung: migrate schreibt die Änderung in die Datenbank, generate aktualisiert die TypeScript-Typen. Ohne generate kennt VS Code die neuen Felder nicht.",
        code: `npx prisma migrate dev --name kategorie-dazu
npx prisma generate
npx prisma studio          # Datenbank im Browser ansehen`,
      },
      {
        label: "Schema-Aufbau",
        description:
          "So sieht ein Modell mit Beziehung aus. @id markiert den Schlüssel, @unique verbietet Doppelte, @default setzt einen Startwert. Die Beziehung braucht immer beides: das Feld mit der ID und das Feld mit dem Objekt.",
        code: `model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  tasks    Task[]              // ein User hat viele Tasks
}

model Task {
  id     String  @id @default(cuid())
  title  String
  done   Boolean @default(false)
  userId String                          // die ID
  user   User    @relation(fields: [userId], references: [id])
}`,
      },
    ],
  },

  // Zod (Validierung)===================================================================
  {
    id: "zod",
    title: "Zod (Validierung)",
    layout: "liste",
    entries: [
      {
        label: "Wofür Zod da ist",
        description:
          "req.body ist für TypeScript ein 'any' — es könnte alles sein: das erwartete Objekt, ein leeres {}, ein Text, null. TypeScript kann das nicht prüfen, weil die Daten erst beim Laufen ankommen. Zod prüft genau das: Passen die Daten zur erwarteten Form?",
      },
      {
        label: "Schema schreiben",
        description:
          "z.object() beschreibt die Form. Die Regeln hängst du mit einem Punkt an. Mit .optional() wird ein Feld freiwillig, mit .default() bekommt es einen Startwert.",
        code: `import z from "zod";

const priorities = z.enum(["low", "medium", "high"]);

const taskSchema = z.object({
  title: z.string().min(1, "Titel darf nicht leer sein"),
  text: z.string(),
  date: z.string().optional(),
  priority: priorities,
});

const userSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export { taskSchema, userSchema, priorities };`,
      },
      {
        label: "safeParse — prüfen in der Route",
        description:
          "safeParse wirft NICHT, sondern gibt ein Ergebnis mit success zurück. Deshalb passt es perfekt zur Guard-Clause-Logik. Passt es: result.data. Passt es nicht: result.error.",
        code: `const result = taskSchema.safeParse(req.body);

if (!result.success) {
  console.error(result.error);      // zeigt dir, WELCHES Feld nicht passt
  return res.status(400).json({ error: "Ungültige Daten" });
}

// ab hier: result.data hat garantiert die richtige Form
const { title, text } = result.data;`,
      },
      {
        label: "Danach IMMER result.data benutzen",
        description:
          "Der häufigste Fehler: Zod prüfen und danach trotzdem req.body benutzen. Dann bringt die Prüfung nichts. result.data ist die geprüfte, typisierte Version.",
        code: `const { email } = req.body;        // ❌ ungeprüft, any
const { email } = result.data;     // ✅ garantiert korrekt`,
      },
      {
        label: "...result.data spreizen",
        description:
          "Der Punkt-Punkt-Punkt kippt alle Felder aus result.data ins data-Objekt. Danach kannst du eigene Felder ergänzen. ACHTUNG bei Passwörtern: die müssen gehasht rein, also dort NICHT spreizen, sondern einzeln setzen.",
        code: `// gut bei Tasks
data: { ...result.data, done: false, userId }

// NICHT bei Passwörtern — sonst landet Klartext in der DB
data: { email: result.data.email, password: hashedPassword }`,
      },
      {
        label: "safeParse vs parse",
        description:
          "parse wirft einen Fehler und braucht ein try/catch. safeParse gibt nur ein Ergebnis zurück. In Routen nimmst du immer safeParse.",
      },
    ],
  },

  // Auth (Login & Token)===================================================================
  {
    id: "auth",
    title: "Auth (Login & Token)",
    layout: "liste",
    entries: [
      {
        label: "Wie das Ganze zusammenhängt",
        description:
          "1) Registrieren: Passwort wird gehasht in die DB gelegt. 2) Login: eingegebenes Passwort wird mit dem Hash verglichen; passt es, gibt es einen Token. 3) Der Token wird im Frontend gespeichert und bei jeder Anfrage mitgeschickt. 4) requireAuth prüft ihn und hängt die userId an den Request.",
      },
      {
        label: "bcrypt — Passwort hashen",
        description:
          "Aus 'geheim123' wird eine unlesbare Zeichenkette. Das ist eine Einbahnstraße — zurückrechnen geht nicht. Beim Login vergleichst du deshalb nicht die Passwörter, sondern lässt bcrypt prüfen, ob das eingegebene zum Hash passt. Die 10 sind die Runden: höher = sicherer, aber langsamer.",
        code: `// beim Registrieren
const hashedPassword = await bcrypt.hash(password, 10);

// beim Login
const isValid = await bcrypt.compare(password, user.password);`,
      },
      {
        label: "POST /register — komplett",
        description:
          "Achtung, hier ist die Prüfung UMGEDREHT: Sonst ist 'nicht gefunden' schlecht, hier ist 'gefunden' schlecht. Die E-Mail soll ja frei sein. Deshalb 409 Conflict — die Anfrage ist in Ordnung, kollidiert aber mit dem Bestand.",
        code: `app.post("/register", async (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }

  const { email, password } = result.data;

  try {
    // UMGEDREHT: wenn gefunden, ist es ein Fehler
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "E-Mail bereits vergeben" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const { password: _, ...rest } = user;   // Passwort rausnehmen
    return res.status(201).json(rest);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "POST /login — komplett",
        description:
          "Wichtig: Bei falscher E-Mail UND bei falschem Passwort dieselbe Meldung. Sonst könnte jemand herausfinden, welche E-Mails registriert sind, indem er die Meldungen vergleicht.",
        code: `app.post("/login", async (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "E-Mail oder Passwort falsch" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "E-Mail oder Passwort falsch" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    const { password: _, ...rest } = user;
    return res.json({ ...rest, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Serverfehler" });
  }
});`,
      },
      {
        label: "requireAuth — die Middleware",
        description:
          "Middleware läuft VOR dem Handler. Sie liest den Token, prüft ihn und hängt die userId an den Request. Danach ruft sie next() auf — erst dadurch läuft deine Route weiter. Ohne next() hängt der Request. Ist der Token kaputt, antwortet sie selbst mit 401 und der Handler wird nie erreicht.",
        code: `function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;   // "Bearer eyJhbGci..."

  if (!authHeader) {
    return res.status(401).json({ error: "Kein Token vorhanden" });
  }

  const token = authHeader.split(" ")[1];   // das "Bearer " abschneiden

  if (!token) {
    return res.status(401).json({ error: "Kein Token vorhanden" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    req.userId = decoded.userId;   // ab jetzt in der Route verfügbar
    next();                        // weiter zum Handler
  } catch (error) {
    return res.status(401).json({ error: "Ungültiger Token" });
  }
}`,
      },
      {
        label: "Passwort aus der Antwort entfernen",
        description:
          "Diese eine Zeile nimmt password heraus und packt alles andere in rest. Der Unterstrich heißt: 'brauche ich nicht'. Dann schickst du nur rest — der Hash verlässt den Server nie.",
        code: `const { password: _, ...rest } = user;
return res.json(rest);`,
      },
      {
        label: "Token im Frontend",
        description:
          "Der Token kommt beim Login zurück und wird gespeichert, damit man beim Neuladen eingeloggt bleibt. Bei jeder geschützten Anfrage kommt er in den Authorization-Header.",
        code: `// speichern
localStorage.setItem("token", token);

// mitschicken
const response = await fetch("http://localhost:3000/tasks", {
  headers: { Authorization: \`Bearer \${token}\` },
});`,
      },
    ],
  },

  // REST & Statuscodes===================================================================
  {
    id: "rest",
    title: "REST & Statuscodes",
    layout: "tabelle",
    entries: [
      {
        label: "GET",
        description: "Daten holen, nichts verändern → 200",
        example: "Alle Tasks anzeigen",
      },
      {
        label: "POST",
        description: "Etwas Neues erstellen → 201",
        example: "Neue Task anlegen",
      },
      {
        label: "PUT",
        description: "Komplett ersetzen, alle Felder mitschicken → 200",
        example: "Task bearbeiten",
      },
      {
        label: "PATCH",
        description: "Nur einzelne Felder ändern → 200",
        example: "done umschalten",
      },
      {
        label: "DELETE",
        description: "Löschen, keine Antwort nötig → 204",
        example: "Task löschen",
      },
      {
        label: "200 OK",
        description: "Hat geklappt, Daten kommen mit",
        example: "GET, PATCH, PUT",
      },
      {
        label: "201 Created",
        description: "Hat geklappt UND etwas Neues wurde angelegt",
        example: "POST",
      },
      {
        label: "204 No Content",
        description: "Hat geklappt, es gibt nichts zurückzugeben",
        example: "DELETE",
      },
      {
        label: "400 Bad Request",
        description: "Die Eingabe ist falsch oder unvollständig",
        example: "Zod lehnt ab, ID fehlt",
      },
      {
        label: "401 Unauthorized",
        description: "Nicht eingeloggt oder Token ungültig",
        example: "Kein Token, falsches Passwort",
      },
      {
        label: "403 Forbidden",
        description: "Eingeloggt, aber nicht erlaubt",
        example: "Bei fremden Daten lieber 404",
      },
      {
        label: "404 Not Found",
        description: "Gibt es nicht — oder nicht für dich",
        example: "Fremde Task",
      },
      {
        label: "409 Conflict",
        description: "Eingabe ok, kollidiert aber mit dem Bestand",
        example: "E-Mail schon registriert",
      },
      {
        label: "500 Server Error",
        description: "Bei uns ist was kaputt",
        example: "DB weg, unerwarteter Fehler",
      },
    ],
  },

  // useState===================================================================
  {
    id: "usestate",
    title: "useState",
    layout: "liste",
    entries: [
      {
        label: "Wofür State da ist",
        description:
          "React zeichnet eine Komponente neu, indem es die Funktion komplett nochmal ausführt. Ein normales let wäre bei jedem Durchlauf wieder weg — und React würde gar nicht merken, dass sich was geändert hat. State löst beides: Der Wert überlebt, und die Änderung löst das Neuzeichnen aus.",
        code: `const [wert, setWert] = useState("");
//     ^ lesen  ^ ändern           ^ Startwert`,
      },
      {
        label: "Typen angeben",
        description:
          "Bei einfachen Startwerten erkennt TypeScript den Typ selbst. Bei null oder leeren Arrays musst du ihn angeben, sonst weiß TypeScript nicht, was später reinkommt.",
        code: `const [name, setName] = useState("");                  // string, klar
const [zahl, setZahl] = useState(0);                   // number, klar
const [tasks, setTasks] = useState<Task[]>([]);        // nötig!
const [aktiv, setAktiv] = useState<Task | null>(null); // nötig!`,
      },
      {
        label: "Niemals direkt zuweisen",
        description:
          "Nur die set-Funktion sagt React 'zeichne neu'. Eine direkte Zuweisung ändert vielleicht den Wert, aber der Bildschirm bleibt gleich.",
        code: `wert = "neu";        // ❌ passiert nichts sichtbar
setWert("neu");      // ✅`,
      },
      {
        label: "Auf dem alten Wert aufbauen",
        description:
          "Wenn der neue Wert vom alten abhängt, gib der set-Funktion eine Funktion mit. Dann bekommst du den garantiert aktuellen Wert — wichtig, wenn mehrere Änderungen schnell hintereinander kommen.",
        code: `setZahl((prev) => prev + 1);
setTasks((prevTasks) => [...prevTasks, neueTask]);`,
      },
      {
        label: "Arrays ändern — immer eine Kopie",
        description:
          "React erkennt Änderungen daran, dass es ein NEUES Array ist. push verändert das alte, deshalb merkt React nichts. Also immer eine neue Liste bauen.",
        code: `// HINZUFÜGEN
setTasks((prev) => [...prev, neueTask]);

// LÖSCHEN
setTasks((prev) => prev.filter((t) => t.id !== id));

// EINEN ÄNDERN
setTasks((prev) =>
  prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
);

// ❌ NIE:
tasks.push(neueTask);`,
      },
      {
        label: "Objekte ändern — auch eine Kopie",
        description:
          "Gleiches Prinzip: Die drei Punkte kopieren alle alten Felder, danach überschreibst du gezielt eins.",
        code: `setUser((prev) => ({ ...prev, name: "Alex" }));
//                    ^ alles Alte    ^ das Neue`,
      },
      {
        label: "Startwert aus localStorage",
        description:
          "Gibst du useState eine Funktion mit, läuft sie nur EINMAL beim ersten Rendern statt bei jedem. Praktisch für Sachen, die etwas kosten.",
        code: `const [token, setToken] = useState<string | null>(() => {
  return localStorage.getItem("token");
});`,
      },
    ],
  },

  // Listen & Array-Methoden===================================================================
  {
    id: "listen",
    title: "Listen & Array-Methoden",
    layout: "liste",
    entries: [
      {
        label: ".map() — umwandeln",
        description:
          "Geht durch und baut eine NEUE Liste mit gleich vielen Einträgen. Objekt rein, JSX raus. Das ist die Methode, mit der du in React Listen anzeigst.",
        code: `{tasks.map((task) => (
  <li key={task.id}>{task.title}</li>
))}

// => ( )  gibt direkt zurück
// => { }  braucht ein eigenes return!`,
      },
      {
        label: ".filter() — aussortieren",
        description:
          "Behält nur die Einträge, bei denen die Bedingung wahr ist. Die Liste wird kürzer, die Einträge selbst bleiben gleich.",
        code: `const offene = tasks.filter((task) => !task.done);
const gefunden = tasks.filter((task) => task.title.includes(suche));

// Löschen im State:
setTasks((prev) => prev.filter((t) => t.id !== id));`,
      },
      {
        label: ".find() — einen suchen",
        description:
          "Gibt den ERSTEN Treffer zurück, nicht eine Liste. Findet es nichts, kommt undefined — also danach prüfen.",
        code: `const task = tasks.find((t) => t.id === id);
if (!task) return;`,
      },
      {
        label: ".some() und .every() — ja oder nein",
        description:
          "some fragt: gibt es mindestens einen? every fragt: trifft es auf alle zu? Beide geben true oder false zurück.",
        code: `const gibtOffene = tasks.some((t) => !t.done);
const allesFertig = tasks.every((t) => t.done);`,
      },
      {
        label: ".includes() — ist etwas drin",
        description:
          "Funktioniert bei Listen und bei Text. Bei der Suche solltest du beides kleinschreiben, sonst findet 'Einkauf' nicht 'einkauf'.",
        code: `const treffer = task.title
  .toLowerCase()
  .includes(suche.toLowerCase());`,
      },
      {
        label: ".sort() — sortieren",
        description:
          "ACHTUNG: sort verändert das Original. In React deshalb vorher kopieren, sonst zeigt der Bildschirm nichts an.",
        code: `const sortiert = [...tasks].sort((a, b) =>
  a.title.localeCompare(b.title),
);

// Zahlen:
const nachZahl = [...items].sort((a, b) => a.wert - b.wert);`,
      },
      {
        label: ".reduce() — zu einem Wert zusammenrechnen",
        description:
          "Rechnet eine ganze Liste auf einen einzigen Wert herunter. Die 0 am Ende ist der Startwert.",
        code: `const summe = zahlen.reduce((total, zahl) => total + zahl, 0);
const anzahlOffen = tasks.reduce(
  (n, t) => (t.done ? n : n + 1),
  0,
);`,
      },
      {
        label: "key — warum nicht der Index",
        description:
          "React vergleicht alt und neu und braucht pro Eintrag ein Erkennungsmerkmal. Der Index ist die POSITION, keine Eigenschaft des Dings: Löschst du den ersten Eintrag, rutschen alle hoch und React verwechselt sie. Bei Buttons fällt das nicht auf, bei Eingabefeldern landen Werte in der falschen Zeile. Die id klebt am Objekt, der Index an der Position.",
        code: `<li key={task.id}>     // ✅
<li key={index}>       // ❌`,
      },
      {
        label: "Ketten: filter + map zusammen",
        description:
          "Beide geben eine neue Liste zurück, also kannst du sie hintereinanderhängen. Erst aussortieren, dann anzeigen.",
        code: `{tasks
  .filter((t) => !t.done)
  .map((t) => (
    <li key={t.id}>{t.title}</li>
  ))}`,
      },
    ],
  },

  // rendern===================================================================
  {
    id: "rendern",
    title: "Bedingtes Rendern",
    layout: "liste",
    entries: [
      {
        label: "&& — zeigen oder nichts",
        description:
          "Ist links wahr, kommt rechts auf den Bildschirm. Ist es falsch, passiert nichts. Nur ein Ausgang.",
        code: `{fehler && <p className="error">{fehler}</p>}
{isLoading && <p>Lädt...</p>}`,
      },
      {
        label: "? : — entweder oder",
        description:
          "Zwei Ausgänge: Ist die Bedingung wahr, kommt das erste, sonst das zweite. Genau ein if/else für JSX.",
        code: `{token ? (
  <TaskListe />
) : (
  <Login onLogin={setToken} />
)}`,
      },
      {
        label: "Fallstrick: Zahlen bei &&",
        description:
          "Ist links eine 0, zeigt React die 0 an statt gar nichts. Deshalb bei Zahlen immer eine echte Bedingung schreiben.",
        code: `{tasks.length && <p>Es gibt Tasks</p>}       // ❌ zeigt "0"
{tasks.length > 0 && <p>Es gibt Tasks</p>}   // ✅`,
      },
      {
        label: "Ein return = ein Element",
        description:
          "Zwei Elemente nebeneinander brauchen eine Hülle: ein <div> oder ein leeres Fragment <>...</>.",
        code: `return (
  <>
    <h1>Titel</h1>
    <p>Text</p>
  </>
);`,
      },
      {
        label: "Die wichtigste Frage: einmal oder pro Element?",
        description:
          "Wo eine Zeile steht, entscheidet, wie oft sie gebaut wird. Außerhalb von .map() einmal, innerhalb pro Eintrag. Bei jedem Stück JSX kurz fragen — die Antwort sagt dir, wo es hingehört.",
        code: `{aktiv && (
  <div>
    <h1>{aktiv.title}</h1>                {/* EINMAL */}
    <button onClick={...}>Zurück</button> {/* EINMAL */}

    {aktiv.entries.map((entry) => (
      <div key={entry.label}>             {/* PRO EINTRAG */}
        <h2>{entry.label}</h2>
      </div>
    ))}
  </div>
)}`,
      },
      {
        label: "Loading / Error / Empty — das Standardmuster",
        description:
          "Drei Zustände, die jede Liste braucht. Ein Status-State statt drei einzelner Booleans ist übersichtlicher, weil sich die Zustände gegenseitig ausschließen.",
        code: `const [status, setStatus] = useState<"loading" | "success" | "error">(
  "loading",
);

// im JSX:
{status === "loading" && <p>Lädt...</p>}
{status === "error" && <p>Fehler beim Laden.</p>}
{status === "success" && tasks.length === 0 && <p>Keine Tasks</p>}
{status === "success" &&
  tasks.map((task) => <TaskItem key={task.id} task={task} />)}`,
      },
      {
        label: "className bedingt setzen",
        description:
          "Das ? : funktioniert auch bei Klassennamen — praktisch für aktive Zustände.",
        code: `<button
  className={istAktiv ? "btn aktiv" : "btn"}
>`,
      },
    ],
  },

  // useEffect===================================================================
  {
    id: "useeffect",
    title: "useEffect",
    layout: "liste",
    entries: [
      {
        label: "Wofür useEffect da ist",
        description:
          "Für alles, was NICHT direkt beim Anzeigen passiert: Daten laden, localStorage schreiben, Timer starten. Die Komponente rendert erst — und danach läuft der Effekt. Faustregel: Alles, was mit der Außenwelt spricht, gehört in useEffect.",
        code: `useEffect(() => {
  // was passieren soll
}, [abhaengigkeiten]);`,
      },
      {
        label: "Das Array am Ende — der wichtigste Teil",
        description:
          "Es sagt, WANN der Effekt läuft. Leeres Array: nur einmal beim ersten Anzeigen. Mit Werten drin: immer, wenn sich einer davon ändert. Ganz weglassen: nach JEDEM Rendern — das führt fast immer zu einer Endlosschleife.",
        code: `useEffect(() => { ... }, []);         // einmal am Anfang
useEffect(() => { ... }, [token]);    // wenn token sich ändert
useEffect(() => { ... });             // ❌ nach jedem Rendern`,
      },
      {
        label: "Daten laden — das Standardmuster",
        description:
          "Die async-Funktion wird INNERHALB des Effekts definiert und dann aufgerufen. Der Effekt selbst darf nicht async sein. Der Guard oben verhindert Laden ohne Token.",
        code: `useEffect(() => {
  const loadTasks = async () => {
    if (!token) return;

    setStatus("loading");
    try {
      const response = await fetch("http://localhost:3000/tasks", {
        headers: { Authorization: \`Bearer \${token}\` },
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const data = await response.json();
      setTasks(data);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  loadTasks();
}, [token]);`,
      },
      {
        label: "Warum der Effekt selbst nicht async sein darf",
        description:
          "useEffect erwartet entweder nichts oder eine Aufräumfunktion als Rückgabe. Eine async-Funktion gibt aber immer ein Promise zurück — das verwirrt React. Deshalb: innen eine async-Funktion definieren und aufrufen.",
        code: `useEffect(async () => { ... }, []);   // ❌

useEffect(() => {                     // ✅
  const laden = async () => { ... };
  laden();
}, []);`,
      },
      {
        label: "localStorage synchron halten",
        description:
          "Immer wenn sich der Token ändert, wird er gespeichert oder gelöscht. Dadurch bleibt man beim Neuladen eingeloggt und ist nach dem Logout wirklich draußen.",
        code: `useEffect(() => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}, [token]);`,
      },
      {
        label: "Aufräumen — die return-Funktion",
        description:
          "Gibst du im Effekt eine Funktion zurück, läuft sie beim Verlassen der Komponente. Wichtig bei Timern und Event-Listenern, sonst laufen die weiter, obwohl niemand mehr hinschaut.",
        code: `useEffect(() => {
  const timer = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => clearInterval(timer);   // aufräumen
}, []);`,
      },
      {
        label: "Endlosschleife vermeiden",
        description:
          "Setzt du im Effekt einen State, der auch im Abhängigkeits-Array steht, ruft er sich selbst immer wieder auf. Merke: Was du im Effekt SETZT, darf nicht im Array stehen.",
        code: `// ❌ Endlosschleife
useEffect(() => {
  setTasks([...]);
}, [tasks]);

// ✅
useEffect(() => {
  setTasks([...]);
}, [token]);`,
      },
      {
        label: "Wann du useEffect NICHT brauchst",
        description:
          "Werte, die du aus vorhandenem State ausrechnen kannst, brauchen keinen Effekt und keinen eigenen State. Einfach beim Rendern berechnen — das ist weniger Code und kann nicht auseinanderlaufen.",
        code: `// ❌ unnötig
const [gefiltert, setGefiltert] = useState([]);
useEffect(() => {
  setGefiltert(tasks.filter((t) => !t.done));
}, [tasks]);

// ✅ einfach berechnen
const gefiltert = tasks.filter((t) => !t.done);`,
      },
    ],
  },

  // Formulare===================================================================
  {
    id: "formulare",
    title: "Formulare",
    layout: "liste",
    entries: [
      {
        label: "Controlled Input — das Grundprinzip",
        description:
          "Das Eingabefeld hat keinen eigenen Speicher. Der Wert kommt aus dem State (value), und jede Eingabe schreibt zurück in den State (onChange). Dadurch weiß React immer, was drinsteht. Fehlt onChange, kann man nichts tippen.",
        code: `const [title, setTitle] = useState("");

<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="Titel"
/>`,
      },
      {
        label: "Komplettes Formular",
        description:
          "e.preventDefault() verhindert, dass der Browser die Seite neu lädt — das ist sein Standardverhalten bei Formularen. Danach kommen Prüfung, Absenden und das Leeren der Felder.",
        code: `function AddTaskForm({ onAddTask }: { onAddTask: (t: Task) => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();          // kein Neuladen
    setFehler("");

    if (!title.trim()) {         // Guard Clause im Frontend
      setFehler("Titel darf nicht leer sein");
      return;
    }

    onAddTask({ title, text });  // nach oben melden

    setTitle("");                // Felder leeren
    setText("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titel"
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Beschreibung"
      />
      <button type="submit">Hinzufügen</button>
      {fehler && <p className="error">{fehler}</p>}
    </form>
  );
}`,
      },
      {
        label: "onSubmit statt onClick",
        description:
          "Am <form> onSubmit, am Button type='submit'. Dann funktioniert auch die Enter-Taste. Bei onClick am Button geht das nicht.",
        code: `<form onSubmit={handleSubmit}>
  ...
  <button type="submit">Speichern</button>
</form>`,
      },
      {
        label: "Select — Auswahlliste",
        description:
          "Funktioniert wie ein Input: value aus dem State, onChange schreibt zurück. Bei einem Union-Type musst du mit 'as' nachhelfen, weil e.target.value für TypeScript nur ein string ist.",
        code: `<select
  value={filter}
  onChange={(e) =>
    setFilter(e.target.value as "all" | "done" | "notDone")
  }
>
  <option value="all">Alle</option>
  <option value="done">Erledigt</option>
  <option value="notDone">Offen</option>
</select>`,
      },
      {
        label: "Checkbox",
        description:
          "Bei Checkboxen heißt es checked statt value, und der Wert steckt in e.target.checked statt e.target.value.",
        code: `<input
  type="checkbox"
  checked={done}
  onChange={(e) => setDone(e.target.checked)}
/>`,
      },
      {
        label: "Absenden mit Server — komplett",
        description:
          "Wenn das Formular direkt an den Server schickt: response.ok prüfen, Fehlermeldung anzeigen, und erst bei Erfolg weitermachen und leeren.",
        code: `const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setFehler("");

  const response = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    setFehler(data.error);
    return;
  }

  onRegistered();
};`,
      },
      {
        label: ".trim() nicht vergessen",
        description:
          "Ein Feld mit nur Leerzeichen ist nicht leer — die Prüfung würde also durchgehen. trim() schneidet Leerzeichen vorne und hinten ab.",
        code: `if (!title.trim()) {
  setFehler("Titel darf nicht leer sein");
  return;
}`,
      },
    ],
  },

  // fetch & API===================================================================
  {
    id: "fetch",
    title: "fetch & API",
    layout: "liste",
    entries: [
      {
        label: "fetch wirft NICHT bei Fehlern",
        description:
          "Der wichtigste Punkt. fetch wirft nur, wenn die Verbindung scheitert — kein Netz, Server aus. Ein 400 oder 500 ist für fetch ein Erfolg: Die Anfrage kam an, der Server hat geantwortet. Ob die Antwort eine Ablehnung war, musst DU prüfen. Ohne diese Prüfung zeigt dein Frontend 'Erfolg' bei jedem Fehler.",
        code: `const response = await fetch(url);

if (!response.ok) {          // true bei 200-299, sonst false
  const data = await response.json();
  setFehler(data.error);
  return;
}`,
      },
      {
        label: "GET mit Token",
        description:
          "Die einfachste Anfrage. Der Token kommt in den Authorization-Header, mit 'Bearer ' davor. Kein method nötig — GET ist der Standard.",
        code: `const response = await fetch("http://localhost:3000/tasks", {
  headers: { Authorization: \`Bearer \${token}\` },
});

if (!response.ok) return;

const data = await response.json();
setTasks(data);`,
      },
      {
        label: "POST mit Body",
        description:
          "Drei Dinge sind nötig: method, der Content-Type-Header (sonst versteht der Server den Body nicht) und JSON.stringify — denn über das Netz gehen nur Texte, keine Objekte.",
        code: `const response = await fetch("http://localhost:3000/tasks", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify({ title, text }),
});`,
      },
      {
        label: "PUT / PATCH / DELETE",
        description:
          "Die ID kommt in die URL. PUT und PATCH brauchen einen Body, DELETE nicht. Bei 204 gibt es keinen Inhalt — dann NICHT .json() aufrufen, das würde abstürzen.",
        code: `// PUT
await fetch(\`http://localhost:3000/tasks/\${id}\`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${token}\`,
  },
  body: JSON.stringify(task),
});

// DELETE — kein Body
await fetch(\`http://localhost:3000/tasks/\${id}\`, {
  method: "DELETE",
  headers: { Authorization: \`Bearer \${token}\` },
});`,
      },
      {
        label: "Das komplette Muster mit allen Absicherungen",
        description:
          "So sieht eine saubere Funktion aus: try/catch für Netzwerkfehler, response.ok für HTTP-Fehler, und erst danach den State ändern. Erst wenn der Server bestätigt hat, wird der Bildschirm aktualisiert.",
        code: `const handleAddTask = async (task: Task) => {
  try {
    const response = await fetch("http://localhost:3000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${token}\`,
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      setFehler("Task konnte nicht gespeichert werden");
      return;
    }

    const savedTask = await response.json();
    setTasks((prev) => [...prev, savedTask]);
  } catch (error) {
    console.error(error);
    setFehler("Server nicht erreichbar");
  }
};`,
      },
      {
        label: "JSON.stringify und .json()",
        description:
          "Über das Netz gehen nur Texte. stringify macht aus deinem Objekt einen Text zum Hinschicken, .json() macht aus dem empfangenen Text wieder ein Objekt. Beide Richtungen brauchst du.",
        code: `body: JSON.stringify({ title })   // Objekt → Text
const data = await response.json(); // Text → Objekt`,
      },
      {
        label: "Warum .json() ein await braucht",
        description:
          "Die Antwort kommt in Stücken über das Netz. .json() wartet, bis alles da ist, und wandelt dann um. Deshalb ist es selbst wieder ein Warte-Vorgang.",
      },
      {
        label: "Reihenfolge: erst Server, dann State",
        description:
          "Immer zuerst die Antwort abwarten und prüfen, dann den State ändern. Andersherum zeigt der Bildschirm etwas an, das der Server nie gespeichert hat — beim nächsten Neuladen ist es weg.",
      },
    ],
  },

  // Komponenten & Props===================================================================
  {
    id: "komponenten",
    title: "Komponenten & Props",
    layout: "liste",
    entries: [
      {
        label: "Props — Daten nach unten geben",
        description:
          "Eine Komponente ist eine Funktion, die JSX zurückgibt. Props sind ihre Parameter. Der Typ steht direkt dahinter oder in einem eigenen Interface.",
        code: `interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div>
      <span>{task.title}</span>
      <button onClick={() => onToggle(task.id)}>Fertig</button>
      <button onClick={() => onDelete(task.id)}>Löschen</button>
    </div>
  );
}

export default TaskItem;`,
      },
      {
        label: "Callbacks — Ereignisse nach oben melden",
        description:
          "Daten fließen über Props nach unten, Ereignisse über Funktionen nach oben. Die Kindkomponente ruft nur onXyz() auf und weiß gar nicht, was daraufhin passiert — genau deshalb ist sie wiederverwendbar.",
        code: `// Eltern gibt die Funktion runter
<Register onRegistered={() => setRegisterSuccess(true)} />

// Kind meldet nur "fertig"
function Register({ onRegistered }: { onRegistered: () => void }) {
  // ...
  onRegistered();
}`,
      },
      {
        label: "Wo gehört State hin?",
        description:
          "So nah wie möglich an die Stelle, die ihn braucht. Braucht ihn nur eine Komponente, gehört er dorthin. Brauchen ihn mehrere oder eine höhere Ebene, muss er nach oben (Lifting State Up). Beispiel: Die Fehlermeldung eines Formulars gehört ins Formular. Die Erfolgsmeldung gehört nach oben, weil die Elternkomponente danach die Ansicht wechseln will.",
      },
      {
        label: "Was im Block deklariert wird, lebt nur dort",
        description:
          "Ein const gilt nur innerhalb der geschweiften Klammern, in denen es steht. Deshalb kannst du eine Variable aus einem try nicht danach benutzen — und State aus einer Komponente nicht in einer anderen.",
      },
      {
        label: "onClick will eine Funktion, keinen Aufruf",
        description:
          "Ohne () => wird die Funktion sofort ausgeführt, während React die Seite baut — nicht beim Klick. Ergebnis: Endlosschleife. Mit () => übergibst du eine Anleitung, die React aufhebt.",
        code: `onClick={() => onDelete(task.id)}   // ✅
onClick={onDelete(task.id)}         // ❌ läuft sofort
onClick={handleClick}               // ✅ ohne Parameter auch ok`,
      },
      {
        label: "import und export",
        description:
          "export ist die Erlaubnis, import die Anforderung — beides nötig. export default gibt es einmal pro Datei und wird ohne Klammern importiert. Benannte Exporte brauchen Klammern. Die Dateiendung lässt du weg.",
        code: `// default
export default TaskItem;
import TaskItem from "./components/TaskItem";

// benannt
export { taskSchema, userSchema };
import { taskSchema } from "./schemas";

// Typen
import type { Task } from "./types";`,
      },
      {
        label: "Eigene Typen zentral ablegen",
        description:
          "Alles, was mehrere Dateien brauchen, kommt in eine types.ts. Dann gibt es eine einzige Wahrheit statt drei Kopien, die auseinanderlaufen.",
        code: `// types.ts
export interface Task {
  id: string;
  title: string;
  text: string;
  done: boolean;
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
}`,
      },
    ],
  },

  // TypeScript===================================================================
  {
    id: "typescript",
    title: "TypeScript",
    layout: "liste",
    entries: [
      {
        label: "Interface — der Bauplan",
        description:
          "Beschreibt, wie ein Ding auszusehen hat. Erzeugt selbst keine Daten. Der Name steht immer in der Einzahl, weil er EIN Ding beschreibt.",
        code: `interface Task {
  id: string;
  title: string;
  done: boolean;
  text?: string;      // ? = darf fehlen
}`,
      },
      {
        label: "[] heißt immer nur 'mehrere'",
        description:
          "Task ist eine Aufgabe, Task[] sind mehrere. Verschachteln ist nur das, was passiert, WENN du so ein Array als Feld in ein anderes Interface schreibst.",
        code: `interface Topic {
  title: string;
  entries: Entry[];   // "hat mehrere Einträge"
}`,
      },
      {
        label: "Die Übersetzungsregel",
        description:
          "Sag den Satz laut und übersetze Wort für Wort. 'Mehrere X' wird X[]. 'Hat einen/eine/ein' wird ein normales Feld. 'Hat mehrere' wird ein Array als Feld. Das ist kein Erfinden, das ist Übersetzen.",
      },
      {
        label: "{ } vs [ ] beim Schreiben von Daten",
        description:
          "{ } ist EIN Ding und bekommt Paare aus name: wert. [ ] sind MEHRERE Dinge und bekommt nur nackte Werte. Jeder Feldname braucht einen Doppelpunkt — auch wenn danach eine Klammer kommt.",
        code: `const team: Team = {          // = nicht vergessen
  name: "Crusaders",          // Komma, nicht Semikolon
  spieler: [                  // Doppelpunkt auch vor [
    { name: "Alex", nummer: 10 },
    { name: "Max", nummer: 7 },
  ],
};`,
      },
      {
        label: "Interface-Syntax vs Daten-Syntax",
        description:
          "Zwei Sprachen, die nur ähnlich aussehen. Interface: kein =, Trenner ist das Semikolon, nach dem Namen kommt ein TYP. Daten: = nötig, Trenner ist das Komma, nach dem Namen kommt ein WERT.",
      },
      {
        label: "Union mit |",
        description:
          "Der Strich heißt 'oder'. Nur die aufgezählten Werte sind erlaubt. Besser als string, weil Tippfehler sofort auffallen und VS Code die Möglichkeiten vorschlägt.",
        code: `type Status = "loading" | "success" | "error";
const [aktiv, setAktiv] = useState<Task | null>(null);`,
      },
      {
        label: "?. und ??",
        description:
          "?. greift nur zu, wenn links nicht null ist — sonst kommt undefined statt einem Absturz. ?? liefert einen Ersatzwert bei null oder undefined. Achtung: || greift auch bei 0 und leerem Text, das ist eine klassische Bugquelle.",
        code: `aktiv?.id                 // kein Absturz bei null
task.text ?? "—"          // Ersatz nur bei null/undefined
task.text || "—"          // greift auch bei "" und 0`,
      },
      {
        label: "Die drei Punkte (Spread)",
        description:
          "Kippt den Inhalt aus. Bei Objekten alle Felder, bei Arrays alle Einträge. Was danach kommt, überschreibt das Vorherige — deshalb funktioniert damit das Ändern einzelner Felder.",
        code: `const kopie = { ...task, done: true };    // alles + done geändert
const neu = [...tasks, neueTask];         // alte Liste + eine neue
const zusammen = [...listeA, ...listeB];  // zwei Listen`,
      },
      {
        label: "Destructuring — auspacken",
        description:
          "Holt Felder aus einem Objekt in einzelne Variablen. Mit dem Rest-Operator kannst du gezielt eins weglassen — genau das machst du beim Passwort.",
        code: `const { title, text } = req.body;
const { password: _, ...rest } = user;   // password weglassen`,
      },
      {
        label: "number vs string",
        description:
          "Könntest du damit rechnen, vergleichen, sortieren? Dann number. Sieht aus wie eine Zahl, aber man rechnet nie damit — Postleitzahl, Telefonnummer? Dann string, sonst verschwinden führende Nullen.",
      },
      {
        label: "import type",
        description:
          "Bei strenger Einstellung nötig, wenn du nur einen Typ importierst. Typen gibt es nur beim Programmieren — im fertigen Code sind sie weg. Das Schlüsselwort sagt dem Bauwerkzeug: kann rausgeworfen werden.",
        code: `import type { Task } from "./types";
import { topics, type Topic } from "./data/topics";`,
      },
    ],
  },

  // Sicherheit & ENV===================================================================
  {
    id: "sicherheit",
    title: "Sicherheit & ENV",
    layout: "liste",
    entries: [
      {
        label: "Rate Limiting — wofür",
        description:
          "Begrenzt, wie viele Anfragen eine IP in einem Zeitfenster schicken darf. Danach kommt 429 Too Many Requests. Ohne Bremse kann jemand ein Skript bauen, das tausende Passwörter pro Minute durchprobiert — das nennt sich Brute-Force. Lokal egal, öffentlich gefährlich. Zweiter Grund: ungebremstes /register lässt jemanden die Datenbank mit Fake-Accounts fluten.",
        code: `npm install express-rate-limit`,
      },
      {
        label: "Zwei Limiter definieren",
        description:
          "Auth-Routen brauchen ein strengeres Limit als normale API-Aufrufe. 10 Logins in 15 Minuten sind viel, 10 Task-Abrufe wären lächerlich wenig. Beide Limiter stehen oben, direkt nach const app = express(), vor den Routen. Das 15 * 60 * 1000 schreibt man ausgerechnet hin, damit man beim Lesen sofort '15 Minuten' erkennt.",
        code: `import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // Zeitfenster
  max: 100,                   // Anfragen pro IP
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Zu viele Versuche. Bitte später erneut." },
  standardHeaders: true,      // zeigt verbleibende Versuche
  legacyHeaders: false,
});`,
      },
      {
        label: "Einbauen — global vs. pro Route",
        description:
          "app.use() ohne Pfad gilt für ALLE Routen und muss ÜBER ihnen stehen, weil Express die Datei von oben nach unten abarbeitet. Der strenge Limiter wird dagegen nicht global eingehängt, sondern nur in die zwei Auth-Routen geschrieben — genau an die Stelle, wo sonst requireAuth steht.",
        code: `app.use(apiLimiter);        // gilt überall, VOR den Routen

app.post("/login", authLimiter, async (req, res) => { ... });
app.post("/register", authLimiter, async (req, res) => { ... });`,
      },
      {
        label: "Testen ohne sich selbst auszusperren",
        description:
          "Nach dem Erreichen des Limits bist du selbst für die volle Zeit gesperrt. Zum Ausprobieren max kurz auf 3 setzen, testen, danach wieder hochdrehen.",
      },
      {
        label: "ENV — wofür",
        description:
          "Ein Wert, der von außen kommt statt im Code zu stehen. Derselbe Code läuft dann lokal und in der Cloud, nur mit anderen Werten. Ohne das steht die Backend-Adresse acht Mal fest verdrahtet im Frontend — nach dem Deploy klopft es weiter bei dir zu Hause an.",
      },
      {
        label: "ENV im Frontend (Vite)",
        description:
          "Zwei Regeln. Erstens: Der Name MUSS mit VITE_ beginnen, sonst ignoriert Vite ihn. Zweitens: Alles im Frontend ist öffentlich — Vite backt die Werte beim Build in die JavaScript-Datei ein, jeder kann sie im Browser lesen. Genau dafür ist das Präfix da: Du sollst bewusst entscheiden, was raus darf. Ins Frontend gehören nur Adressen, niemals Passwörter oder Keys.",
        code: `# .env  (im client-Ordner, keine Anführungszeichen)
VITE_API_URL=http://localhost:3000`,
      },
      {
        label: "Zentrale Konstante statt überall import.meta.env",
        description:
          "Eine eigene config.ts, damit der Zugriff nur an einer Stelle steht. Gleiche Idee wie bei den Daten: Der Wert wohnt an einem Ort, alle anderen importieren ihn. Wichtig: import.meta.env, NICHT process.env — das ist Node.",
        code: `// src/config.ts
export const API_URL = import.meta.env.VITE_API_URL;

// in den Komponenten
import { API_URL } from "./config";        // aus src/
import { API_URL } from "../config";       // aus src/components/

await fetch(\`\${API_URL}/tasks\`, { ... });`,
      },
      {
        label: "Backticks nicht vergessen",
        description:
          "Sobald eine Variable im String steht, brauchst du Backticks statt Anführungszeichen. Sonst rufst du wörtlich die Adresse ${API_URL}/tasks auf.",
        code: `fetch("\${API_URL}/tasks")     // ❌ normaler Text
fetch(\`\${API_URL}/tasks\`)     // ✅`,
      },
      {
        label: "Dev-Server neu starten",
        description:
          "Vite liest die .env nur beim Start. Nach dem Anlegen oder Ändern immer neu starten, sonst ist der Wert undefined. Zum Prüfen: console.log(API_URL) — steht da undefined, liegt die Datei falsch oder der Server lief noch.",
      },
      {
        label: ".gitignore — .env gehört nicht ins Repo",
        description:
          "Das Ausrufezeichen ist eine Ausnahme: 'doch mitnehmen'. Ohne die dritte Zeile würde .env.* auch die Vorlage schlucken. Die .env.example kommt ins Repo, damit man sieht, welche Variablen nötig sind — und damit du selbst in drei Monaten noch weißt, was fehlt.",
        code: `# .gitignore
.env
.env.*
!.env.example`,
      },
      {
        label: "gitignore wirkt nur auf unbekannte Dateien",
        description:
          "Wurde eine Datei schon einmal committet, verfolgt Git sie weiter — die .gitignore hilft dann nicht mehr. Erst aus dem Tracking nehmen, dann greift sie. Das --cached löscht nur die Verfolgung, nicht die Datei selbst.",
        code: `git ls-files | findstr .env      # prüfen, ob drin
git rm --cached server/.env      # aus dem Tracking nehmen
git commit -m "env entfernt"
git push`,
      },
      {
        label: "Was nie ins Repo darf",
        description:
          "JWT_SECRET, Datenbank-Adressen mit Passwort, API-Keys, node_modules und dist. Die letzten beiden nicht wegen Geheimhaltung, sondern weil sie aus dem Quellcode entstehen — der Server baut sie beim Deploy selbst.",
      },
    ],
  },

  // Deployment===================================================================
  {
    id: "deployment",
    title: "Deployment",
    layout: "liste",
    entries: [
      {
        label: "Die drei Teile",
        description:
          "Eine Fullstack-App geht nicht als Ganzes online, sondern in drei Teilen an drei Orten. Datenbank (Neon) ist meist schon in der Cloud. Backend braucht einen Dienst, der einen dauerhaft laufenden Prozess erlaubt (Render, Railway). Frontend sind nur fertige Dateien, die ausgeliefert werden (Netlify, Vercel).",
        code: `Datenbank   →  Neon      (läuft schon)
Backend     →  Render    (dauerhafter Prozess)
Frontend    →  Netlify   (statische Dateien)`,
      },
      {
        label: "Reihenfolge: Backend zuerst",
        description:
          "Das Frontend braucht die Backend-Adresse für seine VITE_API_URL. Die kennst du erst, wenn das Backend läuft. Andersherum müsstest du zweimal ran.",
      },
      {
        label: "Warum Netlify das Backend nicht kann",
        description:
          "Netlify und Vercel liefern fertige Dateien aus und können kurze Funktionen ausführen. Ein Express-Server ist etwas anderes: ein Prozess, der dauerhaft läuft und auf einem Port lauscht. Dafür braucht es einen anderen Diensttyp.",
      },
      {
        label: "PORT muss von außen kommen",
        description:
          "Der Hoster bestimmt selbst, auf welchem Port dein Server lauschen soll, und teilt das über eine Umgebungsvariable mit. Steht die 3000 fest im Code, findet der Hoster deinen Server nicht. Lokal gibt es die Variable nicht, deshalb der Ersatzwert.",
        code: `const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(\`Server läuft auf Port \${port}\`);
});

// Im Log siehst du dann z.B. "Port 10000" — der Beweis,
// dass es ohne den Umbau nicht funktioniert hätte.`,
      },
      {
        label: "dev vs. build vs. start",
        description:
          "Zum Entwickeln übersetzt tsx den TypeScript-Code im Flug und startet bei jeder Änderung neu. Auf einem Server will man das nicht: Dort wird EINMAL übersetzt (build) und dann läuft das Ergebnis (start). Der Hoster fragt nach beiden Befehlen.",
        code: `"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "prisma generate && tsc",
  "start": "node dist/index.js"
}

// prisma generate: der Client liegt nicht im Repo,
//   muss auf dem Server neu erzeugt werden
// tsc: übersetzt TypeScript nach JavaScript
// start: Node führt das fertige JavaScript aus`,
      },
      {
        label: "tsconfig fürs Bauen vorbereiten",
        description:
          "Die Standard-tsconfig ist nur fürs Entwickeln gedacht. Zum Bauen braucht tsc drei Angaben: woher, wohin, und welche Dateien überhaupt. Ohne include nimmt TypeScript ALLE .ts-Dateien im Projekt — auch die, die außerhalb von src liegen, und beschwert sich dann.",
        code: `{
  "compilerOptions": {
    "rootDir": "./src",       // woher
    "outDir": "./dist",       // wohin
    "types": ["node"]         // damit process.env bekannt ist
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
      },
      {
        label: "Root Directory bei Monorepos",
        description:
          "Liegen client und server nebeneinander in einem Repo, sucht der Hoster die package.json standardmäßig im obersten Ordner und findet nichts. Deshalb überall den Unterordner angeben.",
        code: `// Render (Backend)
Root Directory:     server
Build Command:      npm install && npm run build
Start Command:      npm start

// Netlify (Frontend)
Base directory:     client
Build command:      npm run build
Publish directory:  client/dist`,
      },
      {
        label: "WICHTIG: Frontend-ENV wird beim BAUEN eingebacken",
        description:
          "Der Punkt, der am meisten Zeit kostet. Vite ersetzt import.meta.env beim Build durch den festen Wert und schreibt ihn in die JavaScript-Datei. Setzt du die Variable NACH dem Build, ändert sich gar nichts — der alte Wert steckt schon drin. Nach jeder ENV-Änderung muss also neu gebaut werden. Beim Backend ist es anders: process.env wird beim LAUFEN gelesen, da reicht ein Neustart.",
        code: `Frontend (Vite)   →  Wert wird beim BUILD eingebacken
                     →  ENV geändert? Neu bauen!

Backend (Node)    →  Wert wird beim LAUFEN gelesen
                     →  ENV geändert? Neustart reicht.`,
      },
      {
        label: "Eine .env im Repo überschreibt die Hoster-Einstellungen",
        description:
          "Findet der Hoster beim Bauen eine .env-Datei im Projekt, hat die Vorrang vor dem, was du in der Oberfläche eingetragen hast. Deshalb gehört sie nie ins Repo — nicht nur wegen Geheimhaltung, sondern weil sie sonst still die falschen Werte durchsetzt.",
      },
      {
        label: "Der Hoster baut nur bei neuem Commit",
        description:
          "Gleicher Commit wie beim letzten Mal? Dann werden einfach die alten Dateien wiederverwendet — im Log steht dann 'All files already uploaded'. Nur ENV zu ändern reicht nicht. Ein leerer Commit erzwingt einen echten Neubau.",
        code: `git commit --allow-empty -m "trigger rebuild"
git push`,
      },
      {
        label: "CORS einschränken",
        description:
          "Ein leeres cors() erlaubt JEDER Website der Welt, deine API aufzurufen. Lokal egal, online nicht. Nach dem Deploy trägst du die Frontend-Adresse als Umgebungsvariable ein — Rückfall auf localhost fürs Entwickeln. Achtung: Läuft Vite mal auf 5174 statt 5173 (weil 5173 belegt war), blockt CORS auch lokal.",
        code: `app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
}));`,
      },
      {
        label: "Kaltstart beim Gratis-Tarif",
        description:
          "Nach etwa 15 Minuten ohne Anfrage schläft der Server ein. Der nächste Aufruf weckt ihn, das dauert 30–60 Sekunden. Kein Fehler — aber gut zu wissen, wenn man den Link verschickt. Der Ladezustand im Frontend deckt das ab.",
      },
      {
        label: "netlify.toml — Konfiguration im Repo",
        description:
          "Statt alles in der Oberfläche einzustellen, kann die Konfiguration als Datei im Projekt liegen. Vorteil: Sie ist versioniert, und eine Änderung daran erzeugt automatisch einen neuen Commit — also auch einen echten Neubau.",
        code: `# client/netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "https://mein-backend.onrender.com"`,
      },
      {
        label: "Zugriff auf das Repo freigeben",
        description:
          "Der Hoster sieht nur die Repos, für die du ihm beim Verbinden die Erlaubnis gegeben hast. Ein neues Repo taucht deshalb nicht automatisch auf — auch wenn es öffentlich ist. Nachträglich: GitHub → Settings → Applications → die App → Configure.",
      },
      {
        label: "Checkliste vor dem Deploy",
        description:
          "Alles, was vorher stimmen muss. Der letzte Punkt ist der, den man am ehesten vergisst.",
        code: `☐ PORT aus process.env, mit Rückfallwert
☐ build- und start-Skript in package.json
☐ tsconfig: rootDir, outDir, include, types
☐ npm run build läuft lokal fehlerfrei durch
☐ npm start startet den gebauten Server
☐ .env, node_modules, dist in .gitignore
☐ CORS auf die Frontend-Adresse eingeschränkt
☐ ALLE fetch-Aufrufe nutzen die ENV-Variable
   (auch Login und Register, nicht nur App.tsx!)`,
      },
    ],
  },

  // Debugging===================================================================
  {
    id: "debugging",
    title: "Debugging",
    layout: "liste",
    entries: [
      {
        label: "Die Grundregel",
        description:
          "Nicht raten, nicht wild herumprobieren. Fehlermeldung lesen → Vermutung aufstellen → EINE Sache ändern → prüfen. Änderst du drei Dinge gleichzeitig und es geht, weißt du nicht, welche davon es war — und beim nächsten Mal stehst du wieder da.",
      },
      {
        label: "Die Fehlermeldung sagt fast immer, was los ist",
        description:
          "Meldungen wirken lang und abschreckend, enthalten aber meist die Antwort im Klartext. Lies sie ZWEIMAL und such nach: Was wurde versucht? Was war erwartet? Was kam stattdessen? Beispiel unten — da steht wörtlich drin, dass 5174 anfragt, der Server aber nur 5173 erlaubt.",
        code: `Access to fetch at '.../login'
from origin 'http://localhost:5174'
blocked by CORS policy:
'Access-Control-Allow-Origin' has a value 'http://localhost:5173'
that is not equal to the supplied origin.

// Also: Server erlaubt 5173, Anfrage kommt von 5174.`,
      },
      {
        label: "WO steht der Fehler? Drei Orte",
        description:
          "Der häufigste Anfängerfehler ist, am falschen Ort zu suchen. console.error im Backend erscheint NICHT im Browser — es steht im Terminal, wo der Server läuft. Und ein Build-Fehler steht weder im einen noch im anderen, sondern im Deploy-Log beim Hoster.",
        code: `Browser-Konsole (F12)   →  Frontend-Fehler, fetch, React
Server-Terminal         →  console.error, Prisma, Express
Deploy-Log beim Hoster  →  Build-Fehler, fehlende ENV
VS Code Problems-Panel  →  TypeScript beim Schreiben`,
      },
      {
        label: "Der Network-Tab ist dein bester Freund",
        description:
          "F12 → Network. Dort siehst du jede Anfrage: wohin sie ging, welchen Status sie bekam und was zurückkam. Das beantwortet die wichtigste Frage bei API-Problemen: Liegt es am Frontend oder am Backend?",
        code: `Anfrage taucht gar nicht auf   →  Frontend ruft nicht auf
Geht an die falsche Adresse    →  ENV oder hartkodierte URL
Status 401                     →  Token fehlt oder ist abgelaufen
Status 404                     →  Route falsch oder Datensatz weg
Status 500                     →  Backend-Log ansehen
CORS-Fehler                    →  Server erlaubt diese Adresse nicht`,
      },
      {
        label: "Trick: Ändert sich der Dateiname?",
        description:
          "Vite hängt an jede gebaute Datei einen Code aus dem Inhalt an — index-0sHOrdyr.js. Gleicher Inhalt heißt gleicher Code. Steht nach einem angeblichen Neubau derselbe Dateiname da, wurde in Wahrheit nichts neu gebaut. Damit lässt sich in Sekunden klären, ob ein Deploy überhaupt gewirkt hat.",
      },
      {
        label: "Frage 1: Was hat sich zuletzt geändert?",
        description:
          "Ging es vorher und geht jetzt nicht mehr, liegt es fast immer an der letzten Änderung. Nicht das ganze Projekt durchsuchen — bei der letzten Änderung anfangen. Bei Git hilft git diff oder ein Blick in den letzten Commit.",
      },
      {
        label: "Frage 2: Kommt der Code überhaupt hier an?",
        description:
          "Bevor du eine Zeile analysierst, prüf, ob sie ausgeführt wird. Ein console.log an der Stelle beantwortet das sofort. Erscheint nichts, liegt der Fehler WEITER OBEN — eine Guard Clause hat abgebrochen, eine Bedingung war falsch, die Funktion wurde nie aufgerufen.",
        code: `console.log("bin hier", { userId, id });

// Sinnvoller als ein nacktes console.log("test"):
// Du siehst gleich, welche Werte tatsächlich ankommen.`,
      },
      {
        label: "Frage 3: Hat die Variable den erwarteten Wert?",
        description:
          "Sehr viele Fehler sind in Wahrheit undefined an einer Stelle, wo ein Wert erwartet wird. Ein vergessenes await, ein Tippfehler im Feldnamen, eine ENV, die nicht geladen wurde. Ausgeben und nachsehen kostet zehn Sekunden.",
        code: `console.log(API_URL);        // undefined? → .env / Neustart
console.log(req.body);       // leer? → express.json() fehlt
console.log(result.error);   // was genau lehnt Zod ab?`,
      },
      {
        label: "Häufige Meldungen und was sie heißen",
        description:
          "Diese Handvoll deckt den Großteil ab. Die meisten davon hatten wir schon.",
        code: `"Cannot read properties of undefined"
  → Wert ist undefined. await vergessen? Tippfehler?

"Cannot set headers after they are sent"
  → return in einer Guard Clause vergessen

"net::ERR_CONNECTION_REFUSED"
  → Server läuft nicht oder falsche Adresse

"blocked by CORS policy"
  → Server erlaubt diese Herkunft nicht

"is not under rootDir"
  → include in der tsconfig fehlt

"Failed to fetch"
  → Sammelmeldung: CORS, Server aus, oder falsche URL.
     Details stehen in der Zeile DARÜBER.`,
      },
      {
        label: "Wenn nichts hilft: halbieren",
        description:
          "Bei unklaren Fehlern das Problem in zwei Hälften teilen und prüfen, in welcher er steckt. Geht die API mit Postman? Dann liegt es am Frontend. Geht es lokal, aber nicht live? Dann an der Umgebung, nicht am Code. So kommst du in wenigen Schritten zur Ursache statt alles auf einmal zu durchsuchen.",
      },
      {
        label: "Zwischen Frontend und Backend eingrenzen",
        description:
          "Die wichtigste Halbierung überhaupt. Ruf die Backend-URL direkt im Browser auf oder nimm Postman. Kommt dort die erwartete Antwort, ist das Backend in Ordnung und der Fehler liegt im Frontend.",
        code: `// Im Browser aufrufen:
https://mein-backend.onrender.com/

// Kommt "Server läuft"? → Backend ist oben.
// Kommt nichts? → Backend-Log ansehen.`,
      },
      {
        label: "Lokal vs. live",
        description:
          "Läuft es lokal, aber nicht live, ist es fast nie der Code — sondern eine Umgebungsdifferenz: ENV-Variable fehlt, falscher Ordner konfiguriert, Build nicht neu gelaufen, CORS zeigt auf die falsche Adresse. Erst dort suchen, bevor du im Code wühlst.",
      },
      {
        label: "Cache ausschließen",
        description:
          "Der Browser hält alte JavaScript-Dateien fest. Bevor du einen Fehler jagst, der vielleicht längst behoben ist: privates Fenster öffnen (Strg+Shift+N) oder in den Devtools unter Network das Häkchen 'Disable cache' setzen.",
      },
      {
        label: "Das Problems-Panel hinkt manchmal hinterher",
        description:
          "VS Code zeigt dort teils noch alte Fehler an, obwohl die Datei längst korrigiert ist. Was zählt, ist die Ausgabe im Terminal. Zum Auffrischen: Strg+Shift+P → 'TypeScript: Restart TS Server'.",
      },
      {
        label: "Fehler sind Information, kein Rückschlag",
        description:
          "Eine rote Meldung heißt, dass etwas Konkretes nicht passt — und sie sagt dir meistens auch, was. Das ist deutlich besser als Code, der stillschweigend das Falsche tut. Beim Deployment sind mehrere Anläufe der Normalfall, nicht das Zeichen eines Problems.",
      },
    ],
  },
];
