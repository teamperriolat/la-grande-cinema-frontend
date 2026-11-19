import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminPanel from "./AdminPanel";
import SeatPicker from "./SeatPicker";
import { api } from "./api";
import { Movie, SessionUser } from "./types";

function getStoredUser(): SessionUser | null {
  try {
    return JSON.parse(
      localStorage.getItem("user") ?? "null",
    ) as SessionUser | null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [user, setUser] = useState<SessionUser | null>(getStoredUser);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [screeningId, setScreeningId] = useState<string | null>(null);

  const loadMovies = useCallback(async () => {
    const catalog = await api<Movie[]>("/movies");
    setMovies(catalog);
  }, []);

  useEffect(() => {
    api<Movie[]>("/movies")
      .then(setMovies)
      .catch((caughtError: Error) => setError(caughtError.message));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoggingIn(true);
    const data = new FormData(event.currentTarget);

    try {
      const result = await api<{ accessToken: string; user: SessionUser }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: data.get("email"),
            password: data.get("password"),
          }),
        },
      );
      localStorage.setItem("token", result.accessToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      setUser(result.user);
      setIsLoginOpen(false);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setScreeningId(null);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Accueil du Grand Cinéma">
          <span className="brand-mark">GC</span>
          <span>Le Grand Cinéma</span>
        </a>
        <div className="session-summary">
          {user && <span>{user.email}</span>}
          {user ? (
            <button
              className="button button-ghost"
              type="button"
              onClick={logout}
            >
              Déconnexion
            </button>
          ) : (
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setError("");
                setIsLoginOpen(true);
              }}
            >
              Connexion
            </button>
          )}
        </div>
      </header>

      <section id="top" className="hero">
        <p className="eyebrow">Réservation en ligne</p>
        <h1>Votre prochaine séance commence ici.</h1>
        <p>
          Choisissez votre film, visualisez les places disponibles et recevez
          immédiatement votre billet numérique.
        </p>
      </section>

      {error && !isLoginOpen && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <section className="catalog" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">À l’affiche</p>
            <h2 id="catalog-title">Films et séances</h2>
          </div>
          <span>{movies.length} film(s)</span>
        </div>

        <div className="movie-grid">
          {movies.map((movie) => (
            <article className="movie-card" key={movie.id}>
              <div className="movie-poster" aria-hidden="true">
                <span>{movie.title.slice(0, 1)}</span>
              </div>
              <div className="movie-content">
                <span className="duration">{movie.durationMin} min</span>
                <h3>{movie.title}</h3>
                <p>{movie.description}</p>
                <div className="screening-list">
                  {movie.screenings.map((screening) => (
                    <button
                      className="screening-button"
                      key={screening.id}
                      type="button"
                      onClick={() => setScreeningId(screening.id)}
                    >
                      <span>
                        <strong>
                          {new Date(screening.startsAt).toLocaleDateString(
                            "fr-FR",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </strong>
                        {new Date(screening.startsAt).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                      <span>{screening.room}</span>
                      <strong>
                        {(screening.priceCents / 100).toFixed(2)} €
                      </strong>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {screeningId && (
        <SeatPicker
          key={screeningId}
          screeningId={screeningId}
          canReserve={Boolean(user)}
          onClose={() => setScreeningId(null)}
          onRequestLogin={() => setIsLoginOpen(true)}
        />
      )}

      {user?.role === "ADMIN" && (
        <AdminPanel movies={movies} onMoviesChange={loadMovies} />
      )}

      {isLoginOpen && !user && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <button
              className="close-button modal-close"
              type="button"
              onClick={() => setIsLoginOpen(false)}
              aria-label="Fermer la connexion"
            >
              ×
            </button>
            <p className="eyebrow">Espace spectateur</p>
            <h2 id="login-title">Connexion</h2>
            <p className="modal-intro">
              Connectez-vous pour choisir vos sièges et confirmer votre
              réservation.
            </p>
            {error && (
              <p className="alert" role="alert">
                {error}
              </p>
            )}
            <form className="login-form modal-form" onSubmit={login}>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  defaultValue="user@demo.cinema"
                />
              </label>
              <label>
                Mot de passe
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue="DemoUser123!"
                />
              </label>
              <button className="button button-primary" disabled={isLoggingIn}>
                {isLoggingIn ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
