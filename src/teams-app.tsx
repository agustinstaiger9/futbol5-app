import React, { useState } from "react";
import "./style.css";

type MatchType = "5" | "6";

type Player = {
  name: string;
};

type TeamPlayer = Player & {
  position: "GK" | "DEF" | "MID" | "FW";
};

type Team = {
  name: string;
  players: TeamPlayer[];
};

const STORAGE_KEY = "arma-tus-equipos:v1";

type StoredState = {
  matchType: MatchType;
  players: Player[];
};

const safeParseJSON = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const loadStoredState = (): StoredState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParseJSON<StoredState>(raw);
  if (!parsed) return null;

  if (parsed.matchType !== "5" && parsed.matchType !== "6") return null;
  if (!Array.isArray(parsed.players)) return null;

  const expected = parsed.matchType === "5" ? 10 : 12;
  const players = parsed.players
    .slice(0, expected)
    .map((p) => ({ name: typeof p?.name === "string" ? p.name : "" }));

  if (players.length !== expected) return null;
  return { matchType: parsed.matchType, players };
};

const saveStoredState = (state: StoredState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const App: React.FC = () => {
  const stored = typeof window !== "undefined" ? loadStoredState() : null;

  const [matchType, setMatchType] = useState<MatchType>(
    stored?.matchType ?? "5"
  );
  const [players, setPlayers] = useState<Player[]>(
    stored?.players ?? Array(10).fill({ name: "" })
  );
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiredPlayers = matchType === "5" ? 10 : 12;
  const playersPerTeam = matchType === "5" ? 5 : 6;

  const handleChangeMatchType = (type: MatchType) => {
    setMatchType(type);
    setTeams(null);
    setError(null);
    setPlayers(Array(type === "5" ? 10 : 12).fill({ name: "" }));
  };

  const handlePlayerChange = (index: number, name: string) => {
    const copy = [...players];
    copy[index] = { name };
    setPlayers(copy);
  };

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const generateTeams = () => {
    setError(null);
    const filledPlayers = players
      .slice(0, requiredPlayers)
      .map((p) => ({ name: p.name.trim() }))
      .filter((p) => p.name.length > 0);

    if (filledPlayers.length !== requiredPlayers) {
      setError("Por favor no dejes espacios en blanco.");
      setTeams(null);
      return;
    }

    const shuffled = shuffleArray(filledPlayers);

    const teamAPlayers = shuffled.slice(0, playersPerTeam);
    const teamBPlayers = shuffled.slice(playersPerTeam, playersPerTeam * 2);

    const positions5: TeamPlayer["position"][] = ["GK", "DEF", "DEF", "MID", "FW"];
    const positions6: TeamPlayer["position"][] = [
      "GK",
      "DEF",
      "DEF",
      "MID",
      "MID",
      "FW",
    ];

    const positions = matchType === "5" ? positions5 : positions6;

    const teamA: Team = {
      name: "Equipo 1",
      players: teamAPlayers.map((p, idx) => ({
        ...p,
        position: positions[idx],
      })),
    };
    const teamB: Team = {
      name: "Equipo 2",
      players: teamBPlayers.map((p, idx) => ({
        ...p,
        position: positions[idx],
      })),
    };

    setTeams([teamA, teamB]);
  };

  const getPlayersByLine = (team: Team, line: TeamPlayer["position"]) =>
    team.players.filter((p) => p.position === line);

  const handleShare = () => {
    if (!teams) return;
    const [team1, team2] = teams;

    const formatTeam = (team: Team) =>
      team.players
        .map((p) => `${p.name} (${p.position})`)
        .join("\n");

    const message = `Resultados ⚽\n\n${team1.name}:\n${formatTeam(
      team1
    )}\n\n${team2.name}:\n${formatTeam(team2)}`;

    if (navigator.share) {
      navigator
        .share({
          title: "Arma tus equipos",
          text: message,
        })
        .catch(() => {
          // ignore if user cancels
        });
    } else {
      void navigator.clipboard?.writeText(message);
      alert("Resultados copiados. Pegalos en WhatsApp.");
    }
  };

  const handleWhatsApp = () => {
    if (!teams) return;
    const [team1, team2] = teams;

    const formatTeam = (team: Team) =>
      team.players
        .map((p) => `${p.name} (${p.position})`)
        .join("\n");

    const message = `Resultados ⚽\n\n${team1.name}:\n${formatTeam(
      team1
    )}\n\n${team2.name}:\n${formatTeam(team2)}`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSavePlayers = () => {
    saveStoredState({ matchType, players });
    alert("Lista guardada.");
  };

  const handleLoadPlayers = () => {
    const loaded = loadStoredState();
    if (!loaded) {
      alert("No hay una lista guardada.");
      return;
    }
    setMatchType(loaded.matchType);
    setPlayers(loaded.players);
    setTeams(null);
    setError(null);
  };

  const handleClearPlayers = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTeams(null);
    setError(null);
    setMatchType("5");
    setPlayers(Array(10).fill({ name: "" }));
  };

  return (
    <div className="app-root">
      <div className="pitch-container">
        <h1 className="title">
          Arma tus equipos{" "}
          <span className="title-ball" aria-hidden="true">
            ⚽
          </span>
        </h1>

        <div className="toggle-row">
          <button
            className={`toggle-button ${
              matchType === "5" ? "toggle-button-active" : ""
            }`}
            onClick={() => handleChangeMatchType("5")}
          >
            5 vs 5
          </button>
          <button
            className={`toggle-button ${
              matchType === "6" ? "toggle-button-active" : ""
            }`}
            onClick={() => handleChangeMatchType("6")}
          >
            6 vs 6
          </button>
        </div>

        <h2 className="section-title">
          Escribí todos los jugadores ({requiredPlayers})
        </h2>

        <div className="list-actions">
          <button className="small-button" onClick={handleSavePlayers}>
            Guardar
          </button>
          <button className="small-button" onClick={handleLoadPlayers}>
            Cargar
          </button>
          <button className="small-button danger" onClick={handleClearPlayers}>
            Borrar
          </button>
        </div>

        <div className="players-inputs">
          {players.map((player, index) => (
            <input
              key={index}
              className="player-input"
              placeholder={`J${index + 1}`}
              value={player.name}
              onChange={(e) => handlePlayerChange(index, e.target.value)}
            />
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="actions-row">
          <button className="generate-button" onClick={generateTeams}>
            Crear equipos
          </button>
          {teams && (
            <>
              <button className="share-button" onClick={handleShare}>
                Compartir
              </button>
              <button className="whatsapp-button" onClick={handleWhatsApp}>
                WhatsApp
              </button>
            </>
          )}
        </div>

        {teams && (
          <div className="pitch-wrapper">
            <h2 className="section-title">Resultados</h2>
            <div className="teams-row">
              {teams.map((team) => (
                <div key={team.name} className="team-column">
                  <h3 className="team-name">{team.name}</h3>
                  <div className="pitch">
                    <div className="line-row">
                      {getPlayersByLine(team, "GK").map((p) => (
                        <div key={p.name} className="player-badge gk">
                          <span className="player-text">{p.name}</span>
                          <span className="position-text">GK</span>
                        </div>
                      ))}
                    </div>
                    <div className="line-row">
                      {getPlayersByLine(team, "DEF").map((p) => (
                        <div key={p.name} className="player-badge def">
                          <span className="player-text">{p.name}</span>
                          <span className="position-text">DEF</span>
                        </div>
                      ))}
                    </div>
                    <div className="line-row">
                      {getPlayersByLine(team, "MID").map((p) => (
                        <div key={p.name} className="player-badge mid">
                          <span className="player-text">{p.name}</span>
                          <span className="position-text">MID</span>
                        </div>
                      ))}
                    </div>
                    <div className="line-row">
                      {getPlayersByLine(team, "FW").map((p) => (
                        <div key={p.name} className="player-badge fw">
                          <span className="player-text">{p.name}</span>
                          <span className="position-text">FW</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

