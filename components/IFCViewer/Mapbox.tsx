import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiamFja3lsaTk2MTMiLCJhIjoiY21nMDhla3ZlMDBubDJtb2trMTBucjIwdiJ9.GP3eiekLPx0FFlt34tyamw';

export default function Mapbox() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(121.5654);
  const [lat, setLat] = useState(25.0340);
  const [zoom, setZoom] = useState(15);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('move', () => {
      if (!map.current) return;
      setLng(Number(map.current.getCenter().lng.toFixed(4)));
      setLat(Number(map.current.getCenter().lat.toFixed(4)));
      setZoom(Number(map.current.getZoom().toFixed(2)));
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lng, lat, zoom]);

  return (
    <div ref={mapContainer} className="map-container" style={{ width: '100%', height: '100%' }} />
  );
}
