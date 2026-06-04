'use client'

import { useState } from 'react'

/**
 * Progressive "blur-up" image: shows the small thumb instantly (blurred),
 * then cross-fades to the full-resolution image once it loads. Both layers
 * are absolutely positioned, so the parent must be `relative` with a fixed
 * size (e.g. a card hero). Pass the same object-cover className you'd use on
 * a plain <img>.
 */
export function DestImage({
  src,
  thumb,
  alt,
  className = '',
  filter,
  eager = false,
}: {
  src: string
  thumb?: string
  alt: string
  className?: string
  filter?: string
  eager?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const base = `absolute inset-0 w-full h-full object-cover ${className}`

  return (
    <>
      {thumb && thumb !== src && (
        <img
          src={thumb}
          alt=""
          aria-hidden="true"
          className={base}
          style={{
            filter: `${filter ?? ''} blur(16px)`,
            transform: 'scale(1.08)',
            opacity: loaded ? 0 : 1,
            transition: 'opacity 600ms ease',
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={base}
        style={{
          filter,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 600ms ease',
        }}
      />
    </>
  )
}
