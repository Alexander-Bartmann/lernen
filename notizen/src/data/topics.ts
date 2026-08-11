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
  {
    id: "1",
    title: "TS Datenmodell",
    layout: "liste",
    entries: [
      {
        label: "Array",
        description: "Eine Liste mit mehreren Einträgen",
        code: '["Apfel", "Banane"]',
      },
      {
        label: "Object",
        description: "Ein einzelnes Ding mit Eigenschaften",
        code: '{ name: "Alex", nummer: 10 }',
      },
      {
        label: "Interface",
        description:
          "Bauplan für ein Ding. Beschreibt immer EINEN Gegenstand, deshalb Name im Singular.",
        code: "interface Entry { label: string; }",
      },
      {
        label: "[] am Typ",
        description:
          "Heißt immer nur 'mehrere davon'. Entry = ein Eintrag, Entry[] = mehrere.",
        code: "entries: Entry[];",
      },
      {
        label: "? optional",
        description: "Feld darf da sein, muss aber nicht.",
        code: "code?: string;",
      },
      {
        label: "| Union",
        description:
          "Oder. Nur die aufgezählten Werte sind erlaubt — Tippfehler fallen beim Schreiben auf.",
        code: 'layout: "liste" | "tabelle";',
      },
      {
        label: "number vs string",
        description:
          "Könnte man damit rechnen? Dann number. PLZ und Telefonnummer sind string.",
      },
      {
        label: "Verschachteln vs ID",
        description:
          "Gehört das Kind nur zu einem Elternteil? Verschachteln. In der DB geht das nicht, da braucht es IDs.",
      },
      {
        label: "{ } vs [ ]",
        description:
          "{ } bekommt Paare mit Doppelpunkt. [ ] bekommt nackte Werte ohne Namen.",
      },
      {
        label: "Interface vs Daten",
        description:
          "Interface: kein =, Trenner ;. Daten: = nötig, Trenner Komma.",
      },
    ],
  },
  {
    id: "2",
    title: "React Grundlagen",
    layout: "liste",
    entries: [
      {
        label: ".map()",
        description:
          "Wandelt um und gibt zurück. Objekt rein, JSX raus. forEach gibt nichts zurück, deshalb geht das im JSX nicht.",
        code: "{topics.map((t) => <button key={t.id}>{t.title}</button>)}",
      },
      {
        label: "key",
        description:
          "Damit React Elemente beim Neuzeichnen wiedererkennt. Nie der Index — der klebt an der Position, die id klebt am Objekt.",
      },
      {
        label: "Pfeil-Klammern",
        description:
          "=> ( ) gibt direkt zurück. => { } braucht ein eigenes return, sonst bleibt die Liste leer.",
      },
      {
        label: "useState",
        description:
          "Gedächtnis der Komponente. Der Wert überlebt das Neuzeichnen, und die Änderung löst es aus. Ein let wäre bei jedem Durchlauf wieder weg.",
        code: "const [aktiv, setAktiv] = useState<Topic | null>(null);",
      },
      {
        label: "State ändern",
        description: "Nie direkt zuweisen. Immer über die set-Funktion.",
      },
      {
        label: "onClick",
        description:
          "Will eine Funktion, keinen Aufruf. Ohne () => wird sofort ausgeführt statt beim Klick.",
        code: "onClick={() => setAktiv(topic)}",
      },
      {
        label: "Ein return = ein Element",
        description:
          "Mehrere Elemente nebeneinander brauchen einen Wrapper: <div> oder ein Fragment <>.",
      },
      {
        label: "Einmal oder pro Element?",
        description:
          "Wo eine Zeile steht, entscheidet wie oft sie gebaut wird. Außerhalb vom .map() einmal, innerhalb pro Element.",
      },
      {
        label: "&& im JSX",
        description: "Zeig es, oder zeig nichts. Nur ein Ausgang.",
        code: "{aktiv && <div>...</div>}",
      },
      {
        label: "? : im JSX",
        description: "Zeig entweder das eine oder das andere. Zwei Ausgänge.",
        code: "{istTabelle ? <Tabelle /> : <Liste />}",
      },
      {
        label: "?. optional chaining",
        description:
          "Greift nur zu, wenn links nicht null ist. Sonst kommt undefined statt einem Absturz.",
        code: "aktiv?.id",
      },
      {
        label: "?? nullish coalescing",
        description:
          "Ersatzwert, wenn links null oder undefined ist. Anders als ||, das auch bei 0 und leerem Text greift.",
        code: 'entry.example ?? "—"',
      },
      {
        label: "import / export",
        description:
          "export ist die Erlaubnis, import die Anforderung. Beides nötig. Dateiendung im Pfad weglassen.",
        code: 'import { topics } from "./data/topics";',
      },
      {
        label: "import type",
        description:
          "Bei strikter tsconfig für Interfaces. Die existieren nur zur Entwicklungszeit und fliegen beim Bauen raus.",
      },
    ],
  },
  {
    id: "3",
    title: "REST-Methoden",
    layout: "tabelle",
    entries: [
      {
        label: "GET",
        description: "Daten holen, nichts verändern",
        example: "Alle Tasks anzeigen",
      },
      {
        label: "POST",
        description: "Etwas Neues erstellen",
        example: "Neue Task anlegen",
      },
      {
        label: "PUT",
        description: "Etwas Bestehendes komplett ersetzen",
        example: "Task bearbeiten",
      },
      {
        label: "PATCH",
        description: "Etwas Bestehendes teilweise ändern",
        example: "Nur done umschalten",
      },
      {
        label: "DELETE",
        description: "Etwas löschen",
        example: "Task löschen",
      },
    ],
  },
  {
    id: "4",
    title: "Guard Clauses",
    layout: "liste",
    entries: [
      {
        label: "Was ist das",
        description:
          "Prüfung ganz am Anfang, die bei ungültigem Zustand sofort aussteigt. Türsteher: wer nicht reindarf, kommt gar nicht erst rein.",
      },
      {
        label: "Warum Backend",
        description:
          "Alles von außen ist nicht vertrauenswürdig. Jeder kann die API mit Postman direkt aufrufen und das Frontend umgehen. Frontend-Validierung ist Komfort, Backend-Validierung ist Sicherheit.",
      },
      {
        label: "Flacher Code",
        description:
          "Bedingung umdrehen und früh raus, statt if/else-Pyramide. Sonderfälle oben, Normalfall unten und unverschachtelt.",
      },
      {
        label: "return nicht vergessen",
        description:
          "Ohne return läuft die Funktion weiter, macht die Aktion trotzdem und schickt eine zweite Antwort. Express wirft dann 'Cannot set headers after they are sent'.",
        code: 'if (!userId) return res.status(401).json({ error: "..." });',
      },
      {
        label: "In normaler Funktion",
        description: "Kein res vorhanden, deshalb Abbruch mit throw.",
        code: 'if (!name) throw new Error("Ungültiger Name");',
      },
      {
        label: "Reihenfolge",
        description:
          "Billiges zuerst: 1. eingeloggt (401), 2. Eingabe gültig (400), 3. existiert (404), 4. gehört mir (404), 5. Aktion. DB-Zugriffe erst, wenn die reinen Prüfungen durch sind.",
      },
      {
        label: "404 statt 403",
        description:
          "Bei fremden Daten 404 zurückgeben. 403 würde verraten, dass die ID existiert — Angreifer könnten IDs durchprobieren.",
      },
      {
        label: "Type Narrowing",
        description:
          "Nach der Guard Clause weiß TypeScript, dass der Wert nicht mehr undefined ist. Danach ohne ? nutzbar.",
      },
      {
        label: "!id vs Number.isNaN(id)",
        description:
          "! behandelt 0 und leeren Text wie 'nicht vorhanden'. Bei IDs sauberer Number.isNaN prüfen. Gleicher Fallstrick wie || vs ??.",
        code: "if (Number.isNaN(id)) return res.status(400)...",
      },
    ],
  },
];
