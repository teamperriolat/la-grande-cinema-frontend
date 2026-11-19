import { FormEvent, useEffect, useState } from "react";
import { api } from "./api";
import { Movie, Reservation } from "./types";

interface Analytics {
  screeningId: string;
  movieTitle: string;
  startsAt: string;
  capacity: number;
  occupied: number;
  occupancyRate: number;
  forecastAttendance: number;
}

interface AdminReservation extends Reservation {
  user: { email: string };
}

const statusLabels: Record<string, string> = {
  CONFIRMED: "Confirmée",
  USED: "Utilisée",
  CANCELLED: "Annulée",
};

export default function AdminPanel({ movies }: { movies: Movie[] }) {
  const [createdMovies, setCreatedMovies] = useState<Movie[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyForm, setBusyForm] = useState<"movie" | "screening" | null>(null);

  const availableMovies = [
    ...movies,
    ...createdMovies.filter(
      (created) => !movies.some((movie) => movie.id === created.id),
    ),
  ];

  function refresh() {
    void api<Analytics[]>("/admin/analytics").then(setAnalytics);
    void api<AdminReservation[]>("/admin/reservations").then(setReservations);
  }

  useEffect(refresh, []);

  async function createMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusyForm("movie");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const movie = await api<Movie>("/admin/movies", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description"),
          durationMin: Number(data.get("durationMin")),
        }),
      });
      setCreatedMovies((items) => [...items, movie]);
      setMessage(
        `Le film « ${movie.title} » est créé et disponible pour une séance.`,
      );
      form.reset();
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setBusyForm(null);
    }
  }

  async function createScreening(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusyForm("screening");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await api("/admin/screenings", {
        method: "POST",
        body: JSON.stringify({
          movieId: data.get("movieId"),
          startsAt: data.get("startsAt"),
          room: data.get("room"),
          priceCents: Math.round(Number(data.get("priceEuros")) * 100),
          seatCount: Number(data.get("seatCount")),
        }),
      });
      setMessage("La séance est créée avec son plan de salle.");
      form.reset();
      refresh();
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setBusyForm(null);
    }
  }

  async function update(id: string, status: string) {
    setError("");
    try {
      await api(`/admin/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      refresh();
    } catch (caughtError) {
      setError((caughtError as Error).message);
    }
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Espace professionnel</p>
          <h2 id="admin-title">Administration du cinéma</h2>
          <p>
            Programmez les films et les séances depuis un tableau de bord
            unique.
          </p>
        </div>
        <span className="admin-badge">Administrateur</span>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="admin-create-grid">
        <article className="admin-form-card">
          <div className="admin-card-heading">
            <span className="step-number">01</span>
            <div>
              <h3>Créer un film</h3>
              <p>Ajoutez les informations principales du film au catalogue.</p>
            </div>
          </div>
          <form className="admin-form" onSubmit={createMovie}>
            <label>
              Titre du film
              <input
                name="title"
                placeholder="Ex. Le Voyage des Lumières"
                required
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                rows={4}
                placeholder="Présentez le film en quelques lignes…"
                required
              />
            </label>
            <label>
              Durée en minutes
              <input
                name="durationMin"
                type="number"
                min="1"
                placeholder="108"
                required
              />
            </label>
            <button
              className="button button-primary"
              disabled={busyForm !== null}
            >
              {busyForm === "movie" ? "Création…" : "Ajouter le film"}
            </button>
          </form>
        </article>

        <article className="admin-form-card">
          <div className="admin-card-heading">
            <span className="step-number">02</span>
            <div>
              <h3>Créer une séance</h3>
              <p>
                Planifiez une projection et générez automatiquement les places.
              </p>
            </div>
          </div>
          <form
            className="admin-form admin-form-two-columns"
            onSubmit={createScreening}
          >
            <label className="field-wide">
              Film programmé
              <select name="movieId" defaultValue="" required>
                <option value="" disabled>
                  Sélectionner un film
                </option>
                {availableMovies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-wide">
              Date et heure
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              Salle
              <input name="room" placeholder="Salle 1" required />
            </label>
            <label>
              Nombre de places
              <input
                name="seatCount"
                type="number"
                min="1"
                max="200"
                placeholder="30"
                required
              />
            </label>
            <label className="field-wide">
              Prix par place
              <div className="input-with-suffix">
                <input
                  name="priceEuros"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="12.00"
                  required
                />
                <span>€</span>
              </div>
            </label>
            <p className="form-help field-wide">
              Les sièges seront créés automatiquement par rangées de 10 places.
            </p>
            <button
              className="button button-primary field-wide"
              disabled={busyForm !== null}
            >
              {busyForm === "screening"
                ? "Planification…"
                : "Planifier la séance"}
            </button>
          </form>
        </article>
      </div>

      <div className="admin-data-grid">
        <article className="admin-data-card">
          <div className="admin-card-heading compact">
            <div>
              <h3>Remplissage et prévision</h3>
              <p>Suivi des prochaines séances.</p>
            </div>
          </div>
          <div className="analytics-list">
            {analytics.length === 0 && (
              <p className="empty-state">Aucune séance à analyser.</p>
            )}
            {analytics.map((item) => (
              <div className="analytics-item" key={item.screeningId}>
                <div>
                  <strong>{item.movieTitle}</strong>
                  <span>{new Date(item.startsAt).toLocaleString("fr-FR")}</span>
                </div>
                <div
                  className="progress"
                  aria-label={`${item.occupancyRate} % de remplissage`}
                >
                  <span
                    style={{ width: `${Math.min(item.occupancyRate, 100)}%` }}
                  />
                </div>
                <div className="analytics-values">
                  <span>
                    {item.occupied}/{item.capacity} places
                  </span>
                  <strong>{item.occupancyRate} %</strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-data-card reservations-card">
          <div className="admin-card-heading compact">
            <div>
              <h3>Réservations</h3>
              <p>Validation et annulation des billets.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.user.email}</td>
                    <td>{(item.totalCents / 100).toFixed(2)} €</td>
                    <td>
                      <span
                        className={`status status-${item.status.toLowerCase()}`}
                      >
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button
                        type="button"
                        onClick={() => update(item.id, "USED")}
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => update(item.id, "CANCELLED")}
                      >
                        Annuler
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
