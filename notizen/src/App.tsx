import { useState } from "react";
import { topics, type Topic } from "./data/topics";

function App() {
  const [aktivesThema, setAktivesThema] = useState<Topic | null>(null);

  return (
    <div className="app">
      <header className="kopf">
        <h1 className="kopf__titel">Meine Notizen</h1>
        <p className="kopf__zeile">Nachschlagewerk</p>
      </header>

      <nav className="reiter" aria-label="Themen">
        {topics.map((topic) => (
          <button
            key={topic.id}
            className={
              aktivesThema?.id === topic.id
                ? "reiter__btn ist-aktiv"
                : "reiter__btn"
            }
            onClick={() => setAktivesThema(topic)}
          >
            {topic.title}
          </button>
        ))}
      </nav>

      {aktivesThema ? (
        <section className="inhalt">
          <div className="inhalt__kopf">
            <h2 className="inhalt__titel">{aktivesThema.title}</h2>
            <button
              className="schliessen"
              onClick={() => setAktivesThema(null)}
            >
              Schließen
            </button>
          </div>

          {aktivesThema.layout === "tabelle" ? (
            <div className="tabelle__rahmen">
              <table className="tabelle">
                <thead>
                  <tr>
                    <th>Begriff</th>
                    <th>Bedeutung</th>
                    <th>Beispiel</th>
                  </tr>
                </thead>
                <tbody>
                  {aktivesThema.entries.map((entry) => (
                    <tr key={entry.label}>
                      <td>
                        <code className="marke">{entry.label}</code>
                      </td>
                      <td>{entry.description}</td>
                      <td className="gedimmt">{entry.example ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="liste">
              {aktivesThema.entries.map((entry) => (
                <li key={entry.label} className="karte">
                  <h3 className="karte__titel">{entry.label}</h3>
                  <p className="karte__text">{entry.description}</p>
                  {entry.code && (
                    <pre className="karte__code">
                      <code>{entry.code}</code>
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="leer">Oben ein Thema wählen.</p>
      )}
    </div>
  );
}

export default App;
