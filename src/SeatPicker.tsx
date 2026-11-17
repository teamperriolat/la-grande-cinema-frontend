import { useEffect, useState } from 'react';
import { api } from './api';
import { Reservation, ScreeningSeats } from './types';

export default function SeatPicker({ screeningId, canReserve }: { screeningId: string; canReserve: boolean }) {
  const [screening, setScreening] = useState<ScreeningSeats | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState<Reservation | null>(null);
  useEffect(() => {
    api<ScreeningSeats>(`/screenings/${screeningId}/seats`).then(setScreening).catch((e: Error) => setError(e.message));
  }, [screeningId]);
  function toggle(id: string) { setSelected(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]); }
  async function reserve() {
    setError('');
    try {
      const result = await api<Reservation>('/reservations', { method: 'POST', body: JSON.stringify({ screeningId, seatIds: selected }) });
      setTicket(result);
    } catch (e) { setError((e as Error).message); }
  }
  if (error) return <p role="alert">{error}</p>;
  if (!screening) return <p>Chargement des places…</p>;
  return <section>
    <h2>Places — {screening.movie.title}</h2>
    <div>{screening.seats.map(seat => <label key={seat.id}><input type="checkbox" disabled={!seat.available} checked={selected.includes(seat.id)} onChange={() => toggle(seat.id)} />{seat.label} {seat.available ? '' : '(occupée)'}</label>)}</div>
    <p>{selected.length} place(s) sélectionnée(s)</p>
    {canReserve ? <button disabled={!selected.length} onClick={reserve}>Réserver</button> : <p>Connectez-vous pour réserver.</p>}
    {ticket && <article><h3>Billet numérique</h3><p>Code : <strong>{ticket.ticketCode}</strong></p><p>{ticket.screening.movie.title} — {ticket.seats.map(item => item.seat.label).join(', ')} — {(ticket.totalCents / 100).toFixed(2)} €</p></article>}
  </section>;
}
