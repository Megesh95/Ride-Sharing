export type UserRole = "user" | "admin";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type CycleLocation = {
  lat: number;
  lng: number;
  type: string;
  ratePerMinute?: number;
};

export type Cycle = {
  id: number;
  name: string;
  location: CycleLocation;
  status: "available" | "unavailable" | "reserved" | "active";
};

export type BookingStatus = "confirmed" | "cancelled" | "completed";

export type Booking = {
  id: number;
  user_id: number;
  cycle_id: number;
  start_time: string;
  status: BookingStatus;
  cycle_name?: string;
  cycle_location?: CycleLocation;
};

export type ActiveRide = {
  rideId: number;
  cycleId: number;
  cycleName: string;
  cycleLocation: CycleLocation;
  startTime: string; // ISO from backend
  ratePerMinute: number;
  baseFare: number;
  durationSeconds: number;
  fareSoFar: number;
};

export type RideHistoryItem = {
  id: number;
  cycle_id: number;
  cycle_name: string;
  start_time: string;
  end_time: string;
  fare: number;
  duration_seconds: number;
};

export type WalletTransaction = {
  id: number;
  amount: number;
  type: "credit" | "debit";
  created_at: string;
};

