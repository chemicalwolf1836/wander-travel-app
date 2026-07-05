'use client'

import { useState, useRef, useEffect } from 'react'

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
  const imgRef = useRef<HTMLImageElement>(null)
  const base = `absolute inset-0 w-full h-full object-cover ${className}`

  // Catch already-cached images that fire onLoad before React attaches the handler
  useEffect(() => {
    const el = imgRef.current
    if (el?.complete && el.naturalWidth > 0) setLoaded(true)
  }, [src])

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
        ref={imgRef}
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
