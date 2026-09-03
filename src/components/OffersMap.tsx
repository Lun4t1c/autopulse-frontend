"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type Pin = {
  offer_id: string;
  title: string | null;
  url: string;
  price: number | null;
  year: string | null;
  mileage: number | null;
  location: string;
  lat: number;
  lng: number;
};

function formatPrice(price: number | null) {
  if (!price) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function OffersMap({ searchParams }: { searchParams: Record<string, string> }) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const query = new URLSearchParams(searchParams).toString();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/map${query ? `?${query}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => { setPins(data); setLoading(false); })
      .catch(() => { setError("Failed to load map"); setLoading(false); });
  }, [searchParams]);

  if (loading) return (
    <div className="flex h-[500px] items-center justify-center border border-[#d8d1c4] bg-white text-sm text-[#65716c]">
      Loading map...
    </div>
  );

  if (error) return (
    <div className="flex h-[500px] items-center justify-center border border-[#d8d1c4] bg-white text-sm text-[#65716c]">
      {error}
    </div>
  );

  if (!pins.length) return (
    <div className="flex h-[500px] items-center justify-center border border-[#d8d1c4] bg-white text-sm text-[#65716c]">
      No offers with location data for current filters.
    </div>
  );

  return (
    <MapContainer
      center={[52.0, 19.0]}
      zoom={6}
      style={{ height: "500px", width: "100%" }}
      className="border border-[#d8d1c4]"
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map(pin => (
        <Marker key={pin.offer_id} position={[pin.lat, pin.lng]} icon={markerIcon}>
          <Popup>
            <div style={{ minWidth: 200 }}>
              <a href={pin.url} target="_blank" rel="noreferrer"
                style={{ fontWeight: 600, color: "#244c45" }}>
                {pin.title ?? pin.offer_id}
              </a>
              <div style={{ marginTop: 8, fontSize: 12, color: "#5f6964", lineHeight: 1.8 }}>
                <div>💰 {formatPrice(pin.price)}</div>
                {pin.year && <div>📅 {pin.year}</div>}
                {pin.mileage && <div>🛣️ {pin.mileage.toLocaleString("pl-PL")} km</div>}
                <div>📍 {pin.location}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}