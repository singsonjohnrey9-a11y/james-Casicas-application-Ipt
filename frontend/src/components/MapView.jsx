import { useRef, useEffect, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const CEBU_CENTER = [123.8854, 10.3157];

const MAP_STYLES = [
    { id: 'streets', label: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
    { id: 'light', label: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
    { id: 'dark', label: 'Dark', style: 'mapbox://styles/mapbox/dark-v11' },
    { id: 'satellite', label: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { id: 'outdoors', label: '3D Terrain', style: 'mapbox://styles/mapbox/outdoors-v12' },
];

export default function MapView({ listings = [], onMarkerClick, radiusKm, centerCoords }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const popupRef = useRef(null);
    const listingsRef = useRef(listings);
    const [activeStyle, setActiveStyle] = useState('light');
    const [showStyles, setShowStyles] = useState(false);

    listingsRef.current = listings;

    // Build GeoJSON from listings
    const buildGeoJSON = useCallback((data) => ({
        type: 'FeatureCollection',
        features: data.map((l) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [l.longitude, l.latitude] },
            properties: {
                id: l.id,
                title: l.title,
                price: Number(l.price).toLocaleString(),
                category: l.category_display || l.category,
                listing_type: l.listing_type,
                label: l.title.length > 18 ? l.title.slice(0, 16) + '…' : l.title,
                image_url: l.image || l.image_url || '',
                isSell: l.listing_type === 'sell' ? 1 : 0,
            },
        })),
    }), []);

    // Add marker layers to map
    const addMarkerLayers = useCallback((map) => {
        if (map.getSource('listings')) return;

        map.addSource('listings', {
            type: 'geojson',
            data: buildGeoJSON(listingsRef.current),
        });

        // Circle dots (sell = black, buy = white with border)
        map.addLayer({
            id: 'listing-dots',
            type: 'circle',
            source: 'listings',
            paint: {
                'circle-radius': 7,
                'circle-color': ['case', ['==', ['get', 'isSell'], 1], '#0a0a0a', '#ffffff'],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#0a0a0a',
                'circle-opacity': 1,
            },
        });

        // Text labels above dots
        map.addLayer({
            id: 'listing-labels',
            type: 'symbol',
            source: 'listings',
            layout: {
                'text-field': ['get', 'label'],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-size': 10,
                'text-offset': [0, -1.5],
                'text-anchor': 'bottom',
                'text-max-width': 10,
                'text-allow-overlap': false,
                'text-ignore-placement': false,
            },
            paint: {
                'text-color': '#333',
                'text-halo-color': 'rgba(255,255,255,0.9)',
                'text-halo-width': 1.5,
            },
        });

        // Hover popup
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: '200px',
            className: 'map-hover-popup',
            offset: [0, -14],
        });
        popupRef.current = popup;

        map.on('mouseenter', 'listing-dots', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            const f = e.features[0];
            const props = f.properties;
            const coords = f.geometry.coordinates.slice();
            const isSell = props.isSell === 1;

            const imgSrc = props.image_url;
            const imgHTML = imgSrc
                ? `<img src="${imgSrc}" alt="" style="width:100%;height:110px;object-fit:cover;display:block;" />`
                : `<div style="width:100%;height:60px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#ccc;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                   </div>`;

            popup.setLngLat(coords).setHTML(`
                ${imgHTML}
                <div style="padding:8px;">
                  <div style="font-weight:700;font-size:12px;line-height:1.3;margin-bottom:3px;">${props.title}</div>
                  <div style="font-weight:800;font-size:15px;margin-bottom:4px;">₱${props.price}</div>
                  <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#999;">${props.category} · ${isSell ? 'Sale' : 'Buy'}</div>
                  <div style="margin-top:6px;font-size:10px;font-weight:600;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.06em;">View Details →</div>
                </div>
            `).addTo(map);
        });

        map.on('mouseleave', 'listing-dots', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });

        map.on('click', 'listing-dots', (e) => {
            const props = e.features[0].properties;
            const listing = listingsRef.current.find((l) => l.id === props.id);
            if (listing && onMarkerClick) onMarkerClick(listing);
        });
    }, [buildGeoJSON, onMarkerClick]);

    // Initialize map
    useEffect(() => {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: MAP_STYLES.find((s) => s.id === activeStyle)?.style || MAP_STYLES[1].style,
            center: CEBU_CENTER,
            zoom: 12,
            minZoom: 10,
            maxZoom: 18,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
            }),
            'top-right'
        );

        map.on('load', () => {
            addMarkerLayers(map);
            updateRadiusCircle();
        });

        mapRef.current = map;
        return () => map.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Change style
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const styleObj = MAP_STYLES.find((s) => s.id === activeStyle);
        if (styleObj) {
            map.setStyle(styleObj.style);
            map.once('style.load', () => {
                addMarkerLayers(map);
                updateRadiusCircle();
                if (activeStyle === 'outdoors') {
                    map.addSource('mapbox-dem', {
                        type: 'raster-dem',
                        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        tileSize: 512,
                        maxzoom: 14,
                    });
                    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStyle]);

    // Update listings data
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const updateSource = () => {
            const source = map.getSource('listings');
            if (source) {
                source.setData(buildGeoJSON(listings));
            }
        };

        if (map.isStyleLoaded()) {
            updateSource();
        } else {
            map.once('style.load', updateSource);
        }
    }, [listings, buildGeoJSON]);

    // Draw radius circle
    const updateRadiusCircle = useCallback(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const center = centerCoords || CEBU_CENTER;
        const km = radiusKm;

        if (map.getSource('radius-circle')) {
            map.removeLayer('radius-circle-fill');
            map.removeLayer('radius-circle-stroke');
            map.removeSource('radius-circle');
        }

        if (!km || km <= 0) return;

        const points = 64;
        const coords = [];
        const distanceX = km / (111.32 * Math.cos((center[1] * Math.PI) / 180));
        const distanceY = km / 110.574;

        for (let i = 0; i < points; i++) {
            const theta = (i / points) * (2 * Math.PI);
            coords.push([center[0] + distanceX * Math.cos(theta), center[1] + distanceY * Math.sin(theta)]);
        }
        coords.push(coords[0]);

        map.addSource('radius-circle', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } },
        });

        map.addLayer({
            id: 'radius-circle-fill', type: 'fill', source: 'radius-circle',
            paint: { 'fill-color': '#000', 'fill-opacity': 0.05 },
        });
        map.addLayer({
            id: 'radius-circle-stroke', type: 'line', source: 'radius-circle',
            paint: { 'line-color': '#000', 'line-width': 2, 'line-dasharray': [3, 2] },
        });
    }, [radiusKm, centerCoords]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (map.isStyleLoaded()) updateRadiusCircle();
        else map.on('load', updateRadiusCircle);
    }, [updateRadiusCircle]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            <div className="map-style-switcher">
                <button
                    className="map-style-toggle"
                    onClick={() => setShowStyles(!showStyles)}
                    title="Change map style"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                        <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                </button>
                {showStyles && (
                    <div className="map-style-options">
                        {MAP_STYLES.map((s) => (
                            <button
                                key={s.id}
                                className={`map-style-option ${activeStyle === s.id ? 'active' : ''}`}
                                onClick={() => { setActiveStyle(s.id); setShowStyles(false); }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
