// Fired whenever a module writes data that is synced to the user's account,
// so the sync layer can push it. Kept separate from lib/sync.ts so storage
// modules stay dependency-free.
export const DATA_CHANGED_EVENT = 'wander-data-changed'
// Fired after synced data was replaced from the account, so open pages reload.
export const DATA_SYNCED_EVENT = 'wander-data-synced'

export function notifyDataChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}
