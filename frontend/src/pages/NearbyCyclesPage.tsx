import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { ArrowUpDown, Bike, CheckCircle2, LocateFixed, Search } from "lucide-react";
import { api } from "../apiClient";
import type { Cycle } from "../types";
import { useToast } from "../components/ToastProvider";
import { formatCurrency } from "../utils/fare";
import { MobilePage } from "../components/MobilePage";
import { UIBadge, UIButton, UICard, UISkeleton } from "../components/ui";
import "leaflet/dist/leaflet.css";

const mockGPS = { lat: 12.9716, lng: 77.5946 };

const userIcon = L.divIcon({
  className: "sbs-user-marker",
  html: '<div style="width:18px;height:18px;background:#4f46e5;border:3px solid white;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const bikeIcon = L.divIcon({
  className: "sbs-bike-marker",
  html: '<div style="width:18px;height:18px;background:#10b981;border:3px solid white;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function NearbyCyclesPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [distanceKm] = useState(3);
  const [type] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(mockGPS);
  const [locating, setLocating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const query = useMemo(
    () => ({
      lat: userLocation.lat,
      lng: userLocation.lng,
      distanceKm,
      type: type === "all" ? undefined : type,
    }),
    [distanceKm, type, userLocation]
  );

  async function loadCycles() {
    setLoading(true);
    try {
      const r = await api.get("/cycles", { params: query });
      setCycles(r.data.cycles as Cycle[]);
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Failed to load cycles" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Keep last known location if permission denied / unavailable.
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    loadCycles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceKm, type, userLocation.lat, userLocation.lng]);

  async function startRide(cycleId: number) {
    try {
      await api.post("/rides/start", { cycleId });
      toast.pushToast({ type: "success", message: "Ride started. Unlock confirmed." });
      navigate("/active-ride");
    } catch (err: any) {
      toast.pushToast({ type: "error", message: err?.response?.data?.error?.message ?? "Could not start ride" });
    }
  }

  const filteredCycles = cycles.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || String(c.id).includes(q);
  });

  if (loading) {
    return (
      <MobilePage>
        <UISkeleton className="h-56" />
        <UISkeleton className="mt-3 h-24" />
        <UISkeleton className="mt-3 h-24" />
      </MobilePage>
    );
  }

  return (
    <MobilePage>
      <div className="gradient-primary rounded-2xl p-4 text-white shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold">Nearby Cycles</div>
            <div className="text-sm opacity-90">{filteredCycles.length} available nearby {locating ? "• locating..." : ""}</div>
          </div>
          <div className="rounded-xl bg-white/20 p-2">
            <LocateFixed size={18} />
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-white/80" />
          <input
            className="w-full rounded-xl bg-white/15 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/70"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by location or cycle ID..."
          />
        </div>
        <div className="mt-3 flex gap-2">
          <UIBadge className="bg-white text-slate-700">All ({filteredCycles.length})</UIBadge>
          <UIBadge className="bg-white/20 text-white">Available ({filteredCycles.filter((c) => c.status === "available").length})</UIBadge>
          <UIBadge className="bg-white/20 text-white">Nearby ({filteredCycles.length})</UIBadge>
        </div>
      </div>

      <UICard className="map-surface mt-3 p-3">
        <div className="overflow-hidden rounded-2xl border border-emerald-100">
          <MapContainer
            key={`${userLocation.lat.toFixed(4)}-${userLocation.lng.toFixed(4)}`}
            center={[userLocation.lat, userLocation.lng]}
            zoom={14}
            className="h-[230px] w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>Your location</Popup>
            </Marker>
            {filteredCycles.map((c) => (
              <Marker key={`map-${c.id}`} position={[c.location.lat, c.location.lng]} icon={bikeIcon}>
                <Popup>
                  <b>{c.name}</b>
                  <br />
                  {c.location.type} • {formatCurrency(c.location.ratePerMinute ?? 0)}/min
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-700">Campus • {filteredCycles.length} cycles found</div>
          <div className="text-xs text-slate-500">{distanceKm} km</div>
        </div>
      </UICard>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-2xl font-bold text-slate-800">All Cycles</div>
        <UIButton variant="secondary" className="px-3 py-2 text-xs">
          <ArrowUpDown size={14} className="mr-1 inline" /> Sort
        </UIButton>
      </div>

      {filteredCycles.length === 0 ? (
        <UICard className="mt-3">
          <div className="text-sm text-slate-500">No cycles found for current filters.</div>
        </UICard>
      ) : (
        <div className="mt-3 grid gap-3">
          {filteredCycles.map((c) => (
            <UICard key={c.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Bike size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">{c.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{(Math.random() * 0.8 + 0.1).toFixed(1)} km away</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <UIBadge tone="success">Excellent</UIBadge>
                      <UIBadge tone="secondary">{Math.floor(Math.random() * 10) + 90}%</UIBadge>
                    </div>
                  </div>
                </div>
                <CheckCircle2 className="text-emerald-500" size={18} />
              </div>
              <div className="mt-3 flex gap-2">
                <UIButton variant="secondary" className="flex-1" onClick={() => navigate(`/cycles/${c.id}`)}>
                  Details
                </UIButton>
                <UIButton className="flex-1" onClick={() => startRide(c.id)} disabled={c.status === "unavailable"}>
                  Start
                </UIButton>
              </div>
              <div className="mt-2 text-right text-xs text-slate-500">{formatCurrency(c.location.ratePerMinute ?? 0)}/min</div>
            </UICard>
          ))}
        </div>
      )}
    </MobilePage>
  );
}

