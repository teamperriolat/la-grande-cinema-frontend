import { FormEvent, useEffect, useState } from 'react';
import { api } from './api';
import { Movie, Reservation } from './types';

interface Analytics { screeningId: string; movieTitle: string; startsAt: string; capacity: number; occupied: number; occupancyRate: number; forecastAttendance: number }
interface AdminReservation extends Reservation { user: { email: string } }

export default function AdminPanel({ movies }: { movies: Movie[] }) {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [message, setMessage] = useState('');
  function refresh() {
    void api<Analytics[]>('/admin/analytics').then(setAnalytics);
    void api<AdminReservation[]>('/admin/reservations').then(setReservations);
  }
  useEffect(refresh, []);

  async function createMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await api('/admin/movies', { method: 'POST', body: JSON.stringify({ title: data.get('title'), description: data.get('description'), durationMin: Number(data.get('durationMin')) }) });
    setMessage('Film créé. Rechargez la page pour le sélectionner.'); event.currentTarget.reset();
  }
  async function createScreening(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await api('/admin/screenings', { method: 'POST', body: JSON.stringify({ movieId: data.get('movieId'), startsAt: data.get('startsAt'), room: data.get('room'), priceCents: Number(data.get('priceCents')), seatCount: Number(data.get('seatCount')) }) });
    setMessage('Séance créée.'); event.currentTarget.reset(); refresh();
  }
  async function update(id: string, status: string) { await api(`/admin/reservations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); refresh(); }

  return <section>
    <h2>Administration</h2>{message && <p>{message}</p>}
    <h3>Créer un film</h3><form onSubmit={createMovie}><input name="title" placeholder="Titre" required /><input name="description" placeholder="Description" required /><input name="durationMin" type="number" min="1" placeholder="Durée" required /><button>Créer</button></form>
    <h3>Créer une séance</h3><form onSubmit={createScreening}><select name="movieId" required><option value="">Film</option>{movies.map(movie => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</select><input name="startsAt" type="datetime-local" required /><input name="room" placeholder="Salle" required /><input name="priceCents" type="number" min="0" placeholder="Prix centimes" required /><input name="seatCount" type="number" min="1" max="200" placeholder="Places" required /><button>Créer</button></form>
    <h3>Remplissage et prévision</h3><table><thead><tr><th>Film</th><th>Remplissage</th><th>Prévision</th></tr></thead><tbody>{analytics.map(item => <tr key={item.screeningId}><td>{item.movieTitle}</td><td>{item.occupied}/{item.capacity} ({item.occupancyRate} %)</td><td>{item.forecastAttendance}</td></tr>)}</tbody></table>
    <h3>Réservations</h3><table><thead><tr><th>Client</th><th>Montant</th><th>Statut</th><th>Action</th></tr></thead><tbody>{reservations.map(item => <tr key={item.id}><td>{item.user.email}</td><td>{(item.totalCents / 100).toFixed(2)} €</td><td>{item.status}</td><td><button onClick={() => update(item.id, 'USED')}>Utilisée</button><button onClick={() => update(item.id, 'CANCELLED')}>Annuler</button></td></tr>)}</tbody></table>
  </section>;
}
