import { useEffect, useRef } from 'react'
import L from 'leaflet'

// Fix default marker icon paths in bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const GAODE_TILE = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'

export default function MapView({ cities, onCityClick }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: [35.86, 104.19],
      zoom: 5,
      maxZoom: 18,
      minZoom: 3,
      zoomControl: true,
    })

    L.tileLayer(GAODE_TILE, {
      subdomains: ['1', '2', '3', '4'],
      attribution: '&copy; <a href="https://www.amap.com/">高德地图</a>',
    }).addTo(map)

    map.setMaxBounds([[18, 73], [54, 135]])

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || cities.length === 0) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    cities.forEach((city) => {
      const marker = L.marker([city.latitude || city.lat, city.longitude || city.lng])
        .addTo(map)
        .bindTooltip(city.name, {
          permanent: true,
          direction: 'right',
          offset: [8, 0],
          className: 'city-tooltip',
        })

      marker.on('click', () => {
        onCityClick(city)
      })

      markersRef.current.push(marker)
    })
  }, [cities, onCityClick])

  return <div ref={mapRef} className="map-container" />
}
