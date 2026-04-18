import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

interface DistrictData {
  district: string;
  flagged_count: number;
  avg_risk_score: number;
  max_risk_score: number;
  total_amount_at_risk: number;
}

const DISTRICT_COORDS: Record<string, [number, number]> = {
  Ahmedabad: [23.0225, 72.5714],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],
  Rajkot: [22.3039, 70.8022],
  Bhavnagar: [21.7645, 72.1519]
};

function getRiskLabel(score: number, count: number): string {
  if (count === 0) return 'No Data';
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High Risk';
  if (score >= 55) return 'Med Risk';
  return 'Low Risk';
}

function generateScatterPoints(center: [number, number], count: number, radius = 0.35): [number, number, number][] {
  const points: [number, number, number][] = [];
  // Scale down the absolute points to prevent canvas lag, cap at 400 per blob.
  const renderCount = Math.min(Math.ceil(count / 2), 400); 
  
  // Center concentrated hot core
  for (let i = 0; i < renderCount * 0.3; i++) {
    const u = Math.random() + Math.random() - 1.0;
    const v = Math.random() + Math.random() - 1.0;
    points.push([center[0] + u * (radius * 0.4), center[1] + v * (radius * 0.4), 1]);
  }
  
  // Diffuse outer heat
  for (let i = 0; i < renderCount * 0.7; i++) {
    const u = Math.random() + Math.random() + Math.random() - 1.5;
    const v = Math.random() + Math.random() + Math.random() - 1.5;
    points.push([center[0] + u * radius, center[1] + v * radius, 0.4]);
  }
  return points;
}

export default function GujaratHeatmap() {
  const [heatmapData, setHeatmapData] = useState<DistrictData[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    api.get('/analytics/district-heatmap').then((data: any) => {
      setHeatmapData(data.heatmap || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current || heatmapData.length === 0) return;

    if (!leafletInstance.current) {
      // Initialize map centered on Gujarat
      const map = L.map(mapRef.current, {
        center: [22.2587, 71.1924],
        zoom: 7,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        attributionControl: false // Sleek cleaner look
      });

      // Use an elegant light grey basemap suitable for professional dashboards
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      leafletInstance.current = map;
    }

    const map = leafletInstance.current;

    // Clear old marker/heat layers on re-render if any (basic cleanup strategy)
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return; // keep basemap
      map.removeLayer(layer);
    });

    // Generate scatter plot for heatmap.js
    let heatPoints: [number, number, number][] = [];

    heatmapData.forEach((data) => {
      const coords = DISTRICT_COORDS[data.district];
      if (coords && data.flagged_count > 0) {
        // Collect heat points
        const cluster = generateScatterPoints(coords, data.flagged_count, 0.18);
        heatPoints = heatPoints.concat(cluster);

        // Add an invisible interactive marker for the tooltip
        const marker = L.circleMarker(coords, {
          radius: 20,
          fillOpacity: 0,
          stroke: false,
        }).addTo(map);

        const tooltipContent = `
          <div style="padding: 6px 4px; min-width: 140px; font-family: ui-sans-serif, system-ui, sans-serif;">
            <p style="font-weight: 900; color: #1e293b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0 border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">${data.district}</p>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Flags</span>
              <span style="font-size: 11px; font-weight: 900; color: #0f172a;">${data.flagged_count.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Amount</span>
              <span style="font-size: 11px; font-weight: 900; color: #0f172a;">₹${(data.total_amount_at_risk / 100000).toFixed(1)}L</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Avg Risk</span>
              <span style="font-size: 11px; font-weight: 900; color: #0f172a;">${Number(data.avg_risk_score).toFixed(0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Status</span>
              <span style="font-size: 10px; font-weight: 900; color: #dc2626; text-transform: uppercase;">${getRiskLabel(Number(data.avg_risk_score), data.flagged_count)}</span>
            </div>
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          className: 'custom-leaflet-tooltip shadow-2xl rounded-2xl border-0',
          opacity: 1
        });
      }
    });

    // Ensure Leaflet.heat is defined before using it
    if ((L as any).heatLayer && heatPoints.length > 0) {
      (L as any).heatLayer(heatPoints, {
        radius: 35, // much larger radius for smooth merging
        blur: 45,   // highly blurred edges
        maxZoom: 10,
        max: 1.2,
        gradient: {
          0.2: '#93c5fd', // soft light blue
          0.4: '#3b82f6', // medium blue
          0.6: '#f59e0b', // amber
          0.8: '#ef4444', // red
          1.0: '#b91c1c'  // deep red
        }
      }).addTo(map);
    }

  }, [heatmapData]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="flex-1 relative flex flex-col">
      <style>{`
        .custom-leaflet-tooltip {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 8px;
        }
        .leaflet-container {
          background: transparent !important;
          font-family: inherit;
        }
      `}</style>
      <div 
        ref={mapRef} 
        className="w-full h-full flex-grow rounded-[1.25rem] overflow-hidden"
        style={{ minHeight: '350px' }}
      ></div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-between items-center z-10 shrink-0">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">Risk Density</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black font-label text-on-surface-variant">Low</span>
          <div className="w-48 h-2 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-600 ring-1 ring-black/5" />
          <span className="text-[10px] font-black font-label text-on-surface-variant">Critical</span>
        </div>
      </div>
    </div>
  );
}
