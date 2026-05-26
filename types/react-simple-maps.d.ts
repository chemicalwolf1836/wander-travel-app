declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties, MouseEventHandler } from 'react'

  export interface ComposableMapProps {
    projectionConfig?: { scale?: number; center?: [number, number] }
    style?: CSSProperties
    children?: ReactNode
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element

  export interface ZoomableGroupProps {
    zoom?: number
    minZoom?: number
    maxZoom?: number
    children?: ReactNode
  }
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element

  export interface GeographiesProps {
    geography: string
    children: (args: { geographies: Geography[] }) => ReactNode
  }
  export interface Geography {
    rsmKey: string
    [key: string]: unknown
  }
  export function Geographies(props: GeographiesProps): JSX.Element

  export interface GeographyProps {
    geography: Geography
    style?: { default?: CSSProperties; hover?: CSSProperties; pressed?: CSSProperties }
  }
  export function Geography(props: GeographyProps): JSX.Element

  export interface MarkerProps {
    coordinates: [number, number]
    onClick?: MouseEventHandler
    style?: CSSProperties
    children?: ReactNode
  }
  export function Marker(props: MarkerProps): JSX.Element
}
