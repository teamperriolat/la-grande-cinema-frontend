import { FormEvent, useEffect, useState } from 'react';
import { api } from './api';
import { Movie, SessionUser } from './types';
import SeatPicker from './SeatPicker';
import AdminPanel from './AdminPanel';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [user, setUser] = useState<SessionUser | null>(() => JSON.parse(localStorage.getItem('user') ?? 'null') as SessionUser | null);
  const [error, setError] = useState('');
  const [screeningId, setScreeningId] = useState<string | null>(null);
  useEffect(() => { api<Movie[]>('/movies').then(setMovies).catch((e: Error) => setError(e.message)); }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<{ accessToken: string; user: SessionUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      localStorage.setItem('token', result.accessToken); localStorage.setItem('user', JSON.stringify(result.user)); setUser(result.user);
    } catch (e) { setError((e as Error).message); }
  }

  return <main>
    <h1>La Grande Cinéma</h1>
    {!user ? <form onSubmit={login}><h2>Connexion</h2><label>E-mail <input name="email" type="email" required defaultValue="user@demo.cinema" /></label><label>Mot de passe <input name="password" type="password" required defaultValue="DemoUser123!" /></label><button>Se connecter</button></form> : <p>Connecté : {user.email} ({user.role}) <button onClick={() => { localStorage.clear(); setUser(null); }}>Déconnexion</button></p>}
    {error && <p role="alert">{error}</p>}
    <h2>Films et séances</h2>
    {movies.map(movie => <section key={movie.id}><h3>{movie.title}</h3><p>{movie.description} — {movie.durationMin} min</p><ul>{movie.screenings.map(screening => <li key={screening.id}>{new Date(screening.startsAt).toLocaleString('fr-FR')} — {screening.room} — {(screening.priceCents / 100).toFixed(2)} € <button onClick={() => setScreeningId(screening.id)}>Voir les places</button></li>)}</ul></section>)}
    {screeningId && <SeatPicker key={screeningId} screeningId={screeningId} canReserve={Boolean(user)} />}
    {user?.role === 'ADMIN' && <AdminPanel movies={movies} />}
  </main>;
}
