const api = 'https://api.pulselive.motogp.com/motogp/v1/events'
const iso = raw => {
  if (!raw) return null
  const date = new Date(raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'))
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

export async function getSeason(year) {
  const response = await fetch(api + '?seasonYear=' + year, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(25000)
  })
  if (!response.ok) throw new Error('Kalender belum tersedia')
  const events = await response.json()
  if (!Array.isArray(events)) throw new Error('Data kalender tidak valid')
  return events.filter(e => e.kind === 'GP' && e.season?.year === year && e.circuit && e.categories?.some(c => c.name === 'Moto3')).map(event => {
    const sessions = (event.broadcasts || [])
      .filter(b => b.type === 'SESSION' && b.category?.name === 'Moto3' && iso(b.date_start))
      .map(b => ({
        id: b.id, key: b.shortname, title: b.name.trim(), start: iso(b.date_start),
        end: iso(b.date_end), status: b.status, laps: b.num_laps || null
      }))
      .sort((a, b) => a.start.localeCompare(b.start))
    return {
      id: event.id, year, round: event.sequence, name: event.additional_name || event.url,
      country: event.country, city: event.circuit.city, circuit: event.circuit.name,
      from: event.date_start.slice(0, 10), to: event.date_end.slice(0, 10),
      source: 'https://www.motogp.com/id/calendar/' + year + '/event/' + encodeURIComponent(event.url) + '/' + encodeURIComponent(event.id), sessions
    }
  }).sort((a, b) => a.from.localeCompare(b.from))
}
