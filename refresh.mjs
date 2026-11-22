import {readFile, rename, writeFile} from 'node:fs/promises'
import {getSeason} from './schedule.mjs'

const now = new Date()
const year = now.getUTCFullYear()
const previous = await readFile('calendar.json','utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return {events:[]}
  throw error
})
const seasons = await Promise.all([getSeason(year),getSeason(year+1)])
if (!seasons[0].length) throw Error('Official calendar returned no rounds for this season')
const previousNext = previous.events.filter(event => event.year === year+1)
if (previousNext.length && !seasons[1].length) throw Error('Previously published next season is temporarily unavailable')
const events = seasons.flat()
if (new Set(events.map(event => event.id)).size !== events.length) throw Error('Duplicate round ID')
for (const event of events) {
  if (!event.id || !event.name || !event.circuit || !event.from || !event.to || event.from > event.to) throw Error('Invalid round')
  if (!event.source.startsWith('https://www.motogp.com/')) throw Error('Invalid source link')
}
const output = {source:'mirror',checked:now.toISOString(),events}
await writeFile('calendar.next', JSON.stringify(output)+'\n')
await rename('calendar.next','calendar.json')
console.log('Verified',events.length,'rounds against the public MotoGP calendar at',output.checked)
