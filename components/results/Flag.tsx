/* ── Flag image ── */
export function Flag({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      style={{
        width: size,
        height: 'auto',
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        display: 'inline-block',
        flexShrink: 0,
        filter: 'saturate(1.6) contrast(1.1) brightness(1.05)',
      }}
    />
  )
}
