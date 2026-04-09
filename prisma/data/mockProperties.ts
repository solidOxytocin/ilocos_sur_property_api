// Define the Property type
export interface Feature {
  name: string;
  key: string;
}

export interface Amenity {
  name: string;
  key: string;
}
export interface Coordinate {
  lat: number;
  lng: number;
}
export interface Location {
  address: string;
  barangay: string;
  city: string;
  province: string;
  region?: string;
  country: string;
  zipCode?: string;
  coordinates?: Coordinate;
}

export interface Media {
  id: number;
  type: "image" | "video";
  url: string;
  isPrimary?: boolean;
}
export type Property = {
  id: number;
  title: string;
  location: Location;
  features: Feature[];
  amenities: Amenity[];
  media: Media[];
  type: "lot" | "house" | "condo" | "commercial";
  status: "available" | "sold" | "reserved";
  price: number;
  lotArea?: number | null;
  floorArea?: number | null;
  bedrooms?: number | null;
  bedRooms?: number | null;
  bathrooms?: number | null;
  bathRooms?: number | null;
  parking?: number | null;
  details?: string;
  createdAt: string;
  updatedAt?: string;
  slug?: string;
};

// ─── Image pool (realistic real-estate photos) ───────────────────────────────
const HOUSE_IMGS = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687931-cebf10cbdfca?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
];
const LOT_IMGS = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
];
const CONDO_IMGS = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
];
const COMMERCIAL_IMGS = [
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
];

function m(id: number, url: string, isPrimary = false): Media {
  return { id, type: "image", url, isPrimary };
}

// Mock data for properties
export const mockProperties: Property[] = [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 1,
    title: "Prime Lot in Vigan City",
    type: "lot",
    status: "available",
    price: 2500000,
    createdAt: "2026-01-05",
    location: {
      address: "123 Govantes St",
      barangay: "Pantay Daya",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5747, lng: 120.3869 },
    },
    media: [
      m(101, LOT_IMGS[0], true),
      m(102, LOT_IMGS[1]),
    ],
    features: [
      { name: "Main Road", key: "road" },
      { name: "Hospital", key: "hospital" },
    ],
    amenities: [
      { name: "24/7 Security", key: "security" },
    ],
    lotArea: 1500,
    details:
      "Spacious lot in the heart of Vigan City. Ideal for residential or commercial development. Close to schools, hospitals, and main roads.",
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 2,
    title: "Accessible Lot in San Vicente",
    type: "lot",
    status: "available",
    price: 3200000,
    createdAt: "2026-01-10",
    location: {
      address: "456 Quezon Ave",
      barangay: "Barangay I - Amianance",
      city: "San Vicente",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5990, lng: 120.3912 },
    },
    media: [
      m(201, LOT_IMGS[2], true),
      m(202, LOT_IMGS[3]),
    ],
    features: [
      { name: "Main Road", key: "road" },
      { name: "School", key: "school" },
    ],
    amenities: [{ name: "Gym", key: "gym" }],
    lotArea: 1800,
    details:
      "Prime property in San Vicente with excellent road access. Perfect for building a family home or a small business.",
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 3,
    title: "Heritage House in Vigan",
    type: "house",
    status: "sold",
    price: 8500000,
    createdAt: "2025-12-01",
    location: {
      address: "789 Calle Crisologo",
      barangay: "Barangay IV",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5729, lng: 120.3871 },
    },
    media: [
      m(301, HOUSE_IMGS[0], true),
      m(302, HOUSE_IMGS[1]),
      m(303, HOUSE_IMGS[2]),
    ],
    features: [
      { name: "Market", key: "store" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [
      { name: "24/7 Security", key: "security" },
    ],
    lotArea: 1200,
    floorArea: 240,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    details:
      "Classic Ilocano heritage house along the historic Calle Crisologo. A rare find for collectors and heritage enthusiasts.",
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 4,
    title: "Luxury Condo Unit – Vigan CBD",
    type: "condo",
    status: "available",
    price: 4500000,
    createdAt: "2026-02-14",
    location: {
      address: "321 Burgos St",
      barangay: "Barangay I",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5750, lng: 120.3867 },
    },
    media: [
      m(401, CONDO_IMGS[0], true),
      m(402, CONDO_IMGS[1]),
    ],
    features: [{ name: "Parking", key: "parking" }],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "Gym", key: "gym" },
    ],
    floorArea: 110,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    details:
      "Modern condo unit in the Vigan central business district. High-end finishes and full resort amenities.",
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 5,
    title: "Bantay Development Lot",
    type: "lot",
    status: "available",
    price: 2750000,
    createdAt: "2026-01-20",
    location: {
      address: "654 Baluarte Rd",
      barangay: "Barangay III",
      city: "Bantay",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5935, lng: 120.3858 },
    },
    media: [m(501, LOT_IMGS[0], true)],
    features: [
      { name: "Market", key: "store" },
      { name: "Hospital", key: "hospital" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [
      { name: "Gym", key: "gym" },
    ],
    lotArea: 1600,
    details:
      "Flat, ready-to-build lot near the Bantay Bell Tower. Ideal for residential or agri-commercial ventures.",
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 6,
    title: "Large Lot in Magsingal",
    type: "lot",
    status: "available",
    price: 3800000,
    createdAt: "2026-01-25",
    location: {
      address: "987 Rizal St",
      barangay: "Bayubay",
      city: "Magsingal",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.6811, lng: 120.4236 },
    },
    media: [m(601, LOT_IMGS[1], true)],
    features: [{ name: "Market", key: "store" }],
    amenities: [
      { name: "24/7 Security", key: "security" },
      { name: "Swimming Pool", key: "pool" },
    ],
    lotArea: 2700,
    details:
      "Expansive lot ideal for agri-business or subdivision development. Accessible via provincial road.",
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 7,
    title: "Modern Family Home in Santa",
    type: "house",
    status: "available",
    price: 7200000,
    createdAt: "2026-02-01",
    location: {
      address: "22 Mabini St",
      barangay: "Poblacion",
      city: "Santa",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.4954, lng: 120.4377 },
    },
    media: [
      m(701, HOUSE_IMGS[3], true),
      m(702, HOUSE_IMGS[4]),
      m(703, HOUSE_IMGS[5]),
    ],
    features: [
      { name: "School", key: "school" },
      { name: "Market", key: "store" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "24/7 Security", key: "security" },
    ],
    lotArea: 800,
    floorArea: 320,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    details:
      "Newly built 4-bedroom house with a private pool in a quiet residential subdivision. Premium interiors and smart home features.",
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 8,
    title: "Commercial Space – Narvacan Town Center",
    type: "commercial",
    status: "available",
    price: 9500000,
    createdAt: "2026-02-10",
    location: {
      address: "1 Bonifacio Ave",
      barangay: "Poblacion",
      city: "Narvacan",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.4187, lng: 120.4680 },
    },
    media: [
      m(801, COMMERCIAL_IMGS[0], true),
      m(802, COMMERCIAL_IMGS[1]),
    ],
    features: [
      { name: "Main Road", key: "road" },
      { name: "Market", key: "store" },
    ],
    amenities: [{ name: "Elevator", key: "elevator" }],
    floorArea: 450,
    parking: 8,
    details:
      "Prime commercial building with two floors and basement parking. Ground floor suitable for retail; upper floor for offices.",
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    id: 9,
    title: "Beachfront Lot in Sta. Lucia",
    type: "lot",
    status: "reserved",
    price: 6500000,
    createdAt: "2026-02-15",
    location: {
      address: "Coastal Rd",
      barangay: "Balingasay",
      city: "Santa Lucia",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.1305, lng: 120.4482 },
    },
    media: [
      m(901, LOT_IMGS[2], true),
      m(902, LOT_IMGS[3]),
    ],
    features: [
      { name: "Beach Spot", key: "beach" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [],
    lotArea: 3200,
    details:
      "Rare beachfront lot with direct sea access along the Ilocos coast. Ideal for resort or vacation home development.",
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    id: 10,
    title: "Studio Condo in Candon City",
    type: "condo",
    status: "available",
    price: 2100000,
    createdAt: "2026-02-20",
    location: {
      address: "88 Quezon Blvd",
      barangay: "Calongbuyan",
      city: "Candon City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.1959, lng: 120.4484 },
    },
    media: [m(1001, CONDO_IMGS[2], true)],
    features: [{ name: "School", key: "school" }],
    amenities: [{ name: "Gym", key: "gym" }],
    floorArea: 38,
    bedrooms: 1,
    bathrooms: 1,
    details:
      "Affordable studio unit perfect for young professionals or students near Candon City Colleges.",
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    id: 11,
    title: "Residential Lot – Sinait",
    type: "lot",
    status: "available",
    price: 1850000,
    createdAt: "2026-03-01",
    location: {
      address: "34 Del Pilar St",
      barangay: "Sta. Monica",
      city: "Sinait",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.8591, lng: 120.4574 },
    },
    media: [m(1101, LOT_IMGS[0], true)],
    features: [
      { name: "School", key: "school" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [],
    lotArea: 900,
    details:
      "Clean, titled residential lot in a peaceful barangay. Water and electricity connection already available.",
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    id: 12,
    title: "3BR House & Lot – Tagudin",
    type: "house",
    status: "available",
    price: 5600000,
    createdAt: "2026-03-05",
    location: {
      address: "12 Zamora St",
      barangay: "Bimmanga",
      city: "Tagudin",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 16.9354, lng: 120.4447 },
    },
    media: [
      m(1201, HOUSE_IMGS[1], true),
      m(1202, HOUSE_IMGS[2]),
    ],
    features: [
      { name: "Hospital", key: "hospital" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [
      { name: "24/7 Security", key: "security" },
    ],
    lotArea: 600,
    floorArea: 180,
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    details:
      "Well-maintained 3-bedroom house with a garden and covered parking. Walking distance to public market and transport hub.",
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  {
    id: 13,
    title: "Commercial Lot – National Highway Cabugao",
    type: "commercial",
    status: "available",
    price: 12000000,
    createdAt: "2026-03-08",
    location: {
      address: "National Highway",
      barangay: "Sagayad",
      city: "Cabugao",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.7913, lng: 120.4483 },
    },
    media: [
      m(1301, COMMERCIAL_IMGS[2], true),
      m(1302, COMMERCIAL_IMGS[0]),
    ],
    features: [{ name: "Main Road", key: "road" }],
    amenities: [],
    lotArea: 5000,
    details:
      "High-visibility commercial lot along the National Highway. Best for gasoline station, mall, or warehouse development.",
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  {
    id: 14,
    title: "Townhouse in Caoayan",
    type: "house",
    status: "available",
    price: 4800000,
    createdAt: "2026-03-10",
    location: {
      address: "8 Mabini St",
      barangay: "Dupitac",
      city: "Caoayan",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5422, lng: 120.3970 },
    },
    media: [
      m(1401, HOUSE_IMGS[4], true),
      m(1402, HOUSE_IMGS[5]),
    ],
    features: [
      { name: "School", key: "school" },
      { name: "Market", key: "store" },
    ],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
    ],
    lotArea: 120,
    floorArea: 160,
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    details:
      "Brand-new townhouse unit in a gated community. Shared pool and landscaped entrance. Easy access to Vigan City.",
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  {
    id: 15,
    title: "Agri-Commercial Lot in Lapog",
    type: "lot",
    status: "available",
    price: 2200000,
    createdAt: "2026-03-12",
    location: {
      address: "Brgy Road",
      barangay: "Damacuag",
      city: "Lapog",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.7430, lng: 120.4260 },
    },
    media: [m(1501, LOT_IMGS[3], true)],
    features: [{ name: "Main Road", key: "road" }],
    amenities: [],
    lotArea: 4500,
    details:
      "Fertile agri-commercial lot suitable for crops, poultry, or eco-resort. Elevated terrain with scenic mountain views.",
  },

  // ── 16 ────────────────────────────────────────────────────────────────────
  {
    id: 16,
    title: "2BR Condo – San Ildefonso",
    type: "condo",
    status: "reserved",
    price: 3300000,
    createdAt: "2026-03-15",
    location: {
      address: "15 Rizal Ave",
      barangay: "Poblacion",
      city: "San Ildefonso",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.6340, lng: 120.4126 },
    },
    media: [
      m(1601, CONDO_IMGS[3], true),
      m(1602, CONDO_IMGS[0]),
    ],
    features: [
      { name: "School", key: "school" },
      { name: "Market", key: "store" },
    ],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "Gym", key: "gym" },
    ],
    floorArea: 75,
    bedrooms: 2,
    bathrooms: 1,
    details:
      "Cozy 2-bedroom condo unit with modern interior. Clubhouse, pool, and gym access included in the association dues.",
  },

  // ── 17 ────────────────────────────────────────────────────────────────────
  {
    id: 17,
    title: "Commercial Building – Candon City",
    type: "commercial",
    status: "available",
    price: 18500000,
    createdAt: "2026-03-18",
    location: {
      address: "100 Burgos St",
      barangay: "San Nicolas",
      city: "Candon City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.1990, lng: 120.4480 },
    },
    media: [
      m(1701, COMMERCIAL_IMGS[1], true),
      m(1702, COMMERCIAL_IMGS[2]),
    ],
    features: [
      { name: "Main Road", key: "road" },
      { name: "Market", key: "store" },
    ],
    amenities: [
      { name: "Elevator", key: "elevator" },
      { name: "24/7 Security", key: "security" },
    ],
    floorArea: 1200,
    parking: 15,
    details:
      "3-storey commercial building with a ground-floor retail area, 2nd floor offices, and a rooftop deck. Fully leased with stable income.",
  },

  // ── 18 ────────────────────────────────────────────────────────────────────
  {
    id: 18,
    title: "Corner Lot – Sto. Domingo",
    type: "lot",
    status: "available",
    price: 1650000,
    createdAt: "2026-03-20",
    location: {
      address: "Corner Rizal & Luna St",
      barangay: "Barangay II",
      city: "Santo Domingo",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.6660, lng: 120.4204 },
    },
    media: [m(1801, LOT_IMGS[1], true)],
    features: [
      { name: "School", key: "school" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [],
    lotArea: 700,
    details:
      "Corner lot with two road frontages. TCT clean; no encumbrances. Perfect for a sari-sari store or mini-mart.",
  },

  // ── 19 ────────────────────────────────────────────────────────────────────
  {
    id: 19,
    title: "5BR Executive Home – Vigan City",
    type: "house",
    status: "available",
    price: 22000000,
    createdAt: "2026-03-22",
    location: {
      address: "1 Gov. Luna St",
      barangay: "Barangay VIII",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5748, lng: 120.3918 },
    },
    media: [
      m(1901, HOUSE_IMGS[0], true),
      m(1902, HOUSE_IMGS[1]),
      m(1903, HOUSE_IMGS[3]),
      m(1904, HOUSE_IMGS[4]),
    ],
    features: [
      { name: "Main Road", key: "road" },
      { name: "School", key: "school" },
      { name: "Hospital", key: "hospital" },
    ],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "Gym", key: "gym" },
      { name: "24/7 Security", key: "security" },
      { name: "Elevator", key: "elevator" },
    ],
    lotArea: 2000,
    floorArea: 750,
    bedrooms: 5,
    bathrooms: 5,
    parking: 4,
    details:
      "Grand executive home with European-style architecture. Fully air-conditioned with home automation. A prestige address in Vigan.",
  },

  // ── 20 ────────────────────────────────────────────────────────────────────
  {
    id: 20,
    title: "Hillside Lot – Cervantes",
    type: "lot",
    status: "available",
    price: 980000,
    createdAt: "2026-03-25",
    location: {
      address: "Mountain View Rd",
      barangay: "Poblacion",
      city: "Cervantes",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 16.9980, lng: 120.7392 },
    },
    media: [m(2001, LOT_IMGS[2], true)],
    features: [{ name: "Main Road", key: "road" }],
    amenities: [],
    lotArea: 6000,
    details:
      "Cool-climate hillside lot in Cervantes with panoramic views of the Cordillera foothills. Ideal for a mountain retreat or agri-tourism.",
  },

  // ── 21 ────────────────────────────────────────────────────────────────────
  {
    id: 21,
    title: "Warehouse & Office Space – Narvacan",
    type: "commercial",
    status: "available",
    price: 14500000,
    createdAt: "2026-03-27",
    location: {
      address: "Industrial Ave",
      barangay: "Paratong",
      city: "Narvacan",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.4204, lng: 120.4722 },
    },
    media: [
      m(2101, COMMERCIAL_IMGS[0], true),
      m(2102, COMMERCIAL_IMGS[1]),
    ],
    features: [{ name: "Main Road", key: "road" }],
    amenities: [{ name: "24/7 Security", key: "security" }],
    floorArea: 2000,
    parking: 20,
    details:
      "Industrial warehouse with 8-meter ceiling height plus a mezzanine office. 3-phase power, 2 loading docks, and full perimeter fencing.",
  },

  // ── 22 ────────────────────────────────────────────────────────────────────
  {
    id: 22,
    title: "Residential Lot – Santiago",
    type: "lot",
    status: "available",
    price: 1250000,
    createdAt: "2026-03-28",
    location: {
      address: "15 Lopez St",
      barangay: "Immaculate Conception",
      city: "Santiago",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.6051, lng: 120.4488 },
    },
    media: [m(2201, LOT_IMGS[0], true)],
    features: [
      { name: "School", key: "school" },
      { name: "Market", key: "store" },
    ],
    amenities: [],
    lotArea: 500,
    details:
      "Clean-titled residential lot in a quiet barangay. Within walking distance to the municipal hall and public market.",
  },

  // ── 23 ────────────────────────────────────────────────────────────────────
  {
    id: 23,
    title: "4BR House with Pool – Sta. Catalina",
    type: "house",
    status: "available",
    price: 11000000,
    createdAt: "2026-03-30",
    location: {
      address: "55 Quezon St",
      barangay: "Maradodon",
      city: "Santa Catalina",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.3244, lng: 120.4472 },
    },
    media: [
      m(2301, HOUSE_IMGS[2], true),
      m(2302, HOUSE_IMGS[3]),
      m(2303, HOUSE_IMGS[5]),
    ],
    features: [
      { name: "School", key: "school" },
      { name: "Hospital", key: "hospital" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "24/7 Security", key: "security" },
    ],
    lotArea: 1100,
    floorArea: 350,
    bedrooms: 4,
    bathrooms: 4,
    parking: 2,
    details:
      "Resort-style family home with an Olympic-size lap pool. Landscaped garden, covered lanai, and fully tiled interiors throughout.",
  },

  // ── 24 ────────────────────────────────────────────────────────────────────
  {
    id: 24,
    title: "Commercial Lot – Tagudin Highway",
    type: "commercial",
    status: "available",
    price: 8800000,
    createdAt: "2026-04-01",
    location: {
      address: "National Highway",
      barangay: "Puro",
      city: "Tagudin",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 16.9370, lng: 120.4508 },
    },
    media: [m(2401, COMMERCIAL_IMGS[2], true)],
    features: [{ name: "Main Road", key: "road" }],
    amenities: [],
    lotArea: 2400,
    details:
      "Rectangular highway lot with very high daily traffic count. Suitable for fast-food chain, auto dealership, or logistics depot.",
  },

  // ── 25 ────────────────────────────────────────────────────────────────────
  {
    id: 25,
    title: "2-Storey House in Bantay",
    type: "house",
    status: "sold",
    price: 6900000,
    createdAt: "2025-11-15",
    location: {
      address: "9 Magsaysay St",
      barangay: "Abaya",
      city: "Bantay",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5970, lng: 120.3870 },
    },
    media: [
      m(2501, HOUSE_IMGS[5], true),
      m(2502, HOUSE_IMGS[0]),
    ],
    features: [
      { name: "School", key: "school" },
      { name: "Market", key: "store" },
    ],
    amenities: [
      { name: "24/7 Security", key: "security" },
    ],
    lotArea: 350,
    floorArea: 280,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    details:
      "Fully furnished 2-storey home in a safe subdivision. High-end kitchen appliances, CCTV system, and solar panels included.",
  },

  // ── 26 ────────────────────────────────────────────────────────────────────
  {
    id: 26,
    title: "Penthouse Condo – Vigan City",
    type: "condo",
    status: "available",
    price: 9800000,
    createdAt: "2026-04-02",
    location: {
      address: "Top Floor, Star Tower",
      barangay: "Barangay II",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5745, lng: 120.3860 },
    },
    media: [
      m(2601, CONDO_IMGS[1], true),
      m(2602, CONDO_IMGS[3]),
    ],
    features: [
      { name: "Main Road", key: "road" },
      { name: "School", key: "school" },
    ],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "Gym", key: "gym" },
      { name: "Elevator", key: "elevator" },
      { name: "24/7 Security", key: "security" },
    ],
    floorArea: 250,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    details:
      "Sky-high penthouse with 360-degree views of Vigan's skyline and heritage rooftops. Private terrace with jacuzzi.",
  },

  // ── 27 ────────────────────────────────────────────────────────────────────
  {
    id: 27,
    title: "Coastal Lot in San Juan",
    type: "lot",
    status: "available",
    price: 4100000,
    createdAt: "2026-04-03",
    location: {
      address: "Shoreline Drive",
      barangay: "Apatot",
      city: "San Juan",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.7528, lng: 120.4578 },
    },
    media: [
      m(2701, LOT_IMGS[2], true),
      m(2702, LOT_IMGS[3]),
    ],
    features: [
      { name: "Beach Spot", key: "beach" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [],
    lotArea: 2200,
    details:
      "Coastal lot with an unobstructed view of the West Philippine Sea. Road accessible and within 10 minutes of the municipal proper.",
  },

  // ── 28 ────────────────────────────────────────────────────────────────────
  {
    id: 28,
    title: "Bungalow House – Santa Maria",
    type: "house",
    status: "reserved",
    price: 3900000,
    createdAt: "2026-04-04",
    location: {
      address: "46 Emilio Aguinaldo St",
      barangay: "Poblacion",
      city: "Santa Maria",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.3625, lng: 120.4610 },
    },
    media: [
      m(2801, HOUSE_IMGS[1], true),
      m(2802, HOUSE_IMGS[4]),
    ],
    features: [
      { name: "School", key: "school" },
      { name: "Hospital", key: "hospital" },
    ],
    amenities: [
      { name: "24/7 Security", key: "security" },
    ],
    lotArea: 400,
    floorArea: 140,
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    details:
      "Charming single-storey bungalow with large garden. Recently renovated with new roofing and electrical system.",
  },

  // ── 29 ────────────────────────────────────────────────────────────────────
  {
    id: 29,
    title: "Subdivision Lot – Pinili",
    type: "lot",
    status: "available",
    price: 760000,
    createdAt: "2026-04-05",
    location: {
      address: "Green Meadows Subd.",
      barangay: "Garreta",
      city: "Pinili",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.8215, lng: 120.5021 },
    },
    media: [m(2901, LOT_IMGS[1], true)],
    features: [
      { name: "School", key: "school" },
      { name: "Main Road", key: "road" },
    ],
    amenities: [],
    lotArea: 320,
    details:
      "Affordable residential lot inside a planned subdivision. Internal concrete roads, underground drainage, and street lights.",
  },

  // ── 30 ────────────────────────────────────────────────────────────────────
  {
    id: 30,
    title: "Restored Heritage Bahay na Bato – Vigan",
    type: "house",
    status: "available",
    price: 35000000,
    createdAt: "2026-04-06",
    location: {
      address: "5 Mestizo District",
      barangay: "Barangay I",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates: { lat: 17.5730, lng: 120.3869 },
    },
    media: [
      m(3001, HOUSE_IMGS[0], true),
      m(3002, HOUSE_IMGS[2]),
      m(3003, HOUSE_IMGS[3]),
      m(3004, HOUSE_IMGS[5]),
    ],
    features: [
      { name: "Main Road", key: "road" },
      { name: "Market", key: "store" },
      { name: "School", key: "school" },
      { name: "Hospital", key: "hospital" },
    ],
    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "24/7 Security", key: "security" },
      { name: "Elevator", key: "elevator" },
    ],
    lotArea: 1800,
    floorArea: 900,
    bedrooms: 6,
    bathrooms: 6,
    parking: 4,
    details:
      "A meticulously restored 19th-century Bahay na Bato in Vigan's UNESCO World Heritage zone. Original hardwood floors, capiz shell windows, and antique furnishings. The crown jewel of Ilocos Sur real estate.",
  },
];
