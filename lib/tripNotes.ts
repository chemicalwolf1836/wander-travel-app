const KEY = 'wander_trip_notes'

type NoteMap = Record<string, string>

function load(): NoteMap {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as NoteMap } catch { return {} }
}

export function getNote(city: string): string {
  return load()[city] ?? ''
}

export function saveNote(city: string, text: string) {
  const notes = load()
  if (text.trim()) notes[city] = text
  else delete notes[city]
  localStorage.setItem(KEY, JSON.stringify(notes))
}
