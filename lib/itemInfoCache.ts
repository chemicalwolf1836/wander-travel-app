// Client-side cache for /api/item-info results so re-clicks and pre-hovers are
// instant. This is shared module state: prefetchItem (called on chip hover) writes
// the same cache that ItemModal reads, so both must import from this one module.

const itemInfoCache = new Map<string, { description?: string; image?: string }>()
const itemInfoFetching = new Set<string>()

export function prefetchItem(name: string, city: string) {
  const key = `${name}::${city}`
  if (itemInfoCache.has(key) || itemInfoFetching.has(key)) return
  itemInfoFetching.add(key)
  fetch(`/api/item-info?name=${encodeURIComponent(name)}&context=${encodeURIComponent(city)}`)
    .then(r => r.json())
    .then((d: { description?: string; image?: string }) => {
      itemInfoCache.set(key, d)
      itemInfoFetching.delete(key)
    })
    .catch(() => itemInfoFetching.delete(key))
}

export { itemInfoCache }
