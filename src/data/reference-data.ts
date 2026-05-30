export type ReferenceItem = {
  name: string;
  key: string;
};

export const REFERENCE_FEATURES: ReferenceItem[] = [
  { name: "Main Road", key: "road" },
  { name: "Hospital", key: "hospital" },
  { name: "School", key: "school" },
  { name: "Market", key: "store" },
  { name: "Beach Spot", key: "beach" },
  { name: "Mall Nearby", key: "shopping" },
  { name: "Parking", key: "parking" },
  { name: "Church/Chapel", key: "church" },
  { name: "Transport Hub", key: "transport" },
  { name: "Nature/Park", key: "nature" },
  { name: "Restaurant", key: "restaurant" },
  { name: "Gas Station", key: "gas_station" },
  { name: "Gated Community", key: "gated" },
  { name: "Fiber/Internet", key: "wifi" },
  { name: "Mountain View", key: "mountain" },
];

export const REFERENCE_AMENITIES: ReferenceItem[] = [
  { name: "Swimming Pool", key: "pool" },
  { name: "Gym", key: "gym" },
  { name: "24/7 Security", key: "security" },
  { name: "Elevator", key: "elevator" },
  { name: "CCTV", key: "cctv" },
  { name: "Water System", key: "water" },
  { name: "Solar Power", key: "solar" },
  { name: "Garden/Yard", key: "garden" },
  { name: "Balcony", key: "balcony" },
  { name: "Covered Parking", key: "covered_parking" },
];
