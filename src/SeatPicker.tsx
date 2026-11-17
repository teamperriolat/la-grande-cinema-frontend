import { useEffect, useState } from 'react';
import { api } from './api';
import { ScreeningSeats } from './types';

export default function SeatPicker({ screeningId }: { screeningId: string }) {
  const [screening, setScreening] = useState<ScreeningSeats | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api<ScreeningSeats>(`/screenings/${screeningId}/seats`).then(setScreening).catch((e: Error) => setError(e.message));
  }, [screeningId]);
  function toggle(id: string) { setSelected(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]); }
  if (error) return <p role="alert">{error}</p>;
  if (!screening) return <p>Chargement des places…</p>;
  return <section>
    <h2>Places — {screening.movie.title}</h2>
    <div>{screening.seats.map(seat => <label key={seat.id}><input type="checkbox" disabled={!seat.available} checked={selected.includes(seat.id)} onChange={() => toggle(seat.id)} />{seat.label} {seat.available ? '' : '(occupée)'}</label>)}</div>
    <p>{selected.length} place(s) sélectionnée(s)</p>
  </section>;
}
