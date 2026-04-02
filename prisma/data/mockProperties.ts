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
  lotArea?: number;
  floorArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  details?: string;
  createdAt: string;
  updatedAt?: string;
  slug?: string;
};

// Mock data for properties
export const mockProperties: Property[] = [
  {
    id: 1,
    title: "Prime Lot in Vigan City",
    type: "lot",
    status: "available",
    price: 250000,
    createdAt: "2026-03-07",
    updatedAt: "2026-03-07",

    location: {
      address: "123 Main St",
      barangay: "Pantay Daya",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
    },

    media: [
      {
        id: 2,
        type: "image",
        url: "https://media.istockphoto.com/id/2155879454/photo/this-is-an-exterior-photo-of-a-home-for-sale-in-beverly-hills-ca.jpg?s=612x612&w=0&k=20&c=uSKacMQvmaYX5Pf5Br7pUfErYQbNt_UWXRTjfwrdSDQ=",
        isPrimary: true,
      },
    ],

    features: [
      { name: "Main Road", key: "road" },
      { name: "Hospital", key: "hospital" },
    ],

    amenities: [
      { name: "Swimming Pool", key: "pool" },
      { name: "24/7 Security", key: "security" },
    ],

    lotArea: 1500,

    details:
      "Spacious lot located in the heart of Vigan City, ideal for residential or commercial development. Close to schools, hospitals, and main roads for easy access.",
  },

  {
    id:3,
    title: "Accessible Lot in San Vicente",
    type: "lot",
    status: "available",
    price: 320000,
    createdAt: "2026-03-07",

    location: {
      address: "456 Oak Ave",
      barangay: "Barangay I - Amianance",
      city: "San Vicente",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates:
        {
          lat: 123,
          lng: 321
        }
    },

    media: [
      {
        id: 1,
        type: "image",
        url: "https://agentrealestateschools.com/wp-content/uploads/2021/11/real-estate-property.jpg",
        isPrimary: true,
      },
    ],

    features: [
      { name: "Main Road", key: "road" },
      { name: "School", key: "school" },
      { name: "Hospital", key: "hospital" },
    ],

    amenities: [
      { name: "Gym", key: "gym" }
    ],

    lotArea: 1800,

    details:
      "Prime property in San Vicente with excellent road access. Perfect for building a family home or a small business. Close to schools and healthcare facilities.",
  },

  {
    id: 3,
    title: "Central Lot in Vigan",
    type: "lot",
    status: "available",
    price: 180000,
    createdAt: "2026-03-07",
    updatedAt: "2026-03-07",

    location: {
      address: "789 Pine Rd",
      barangay: "Barangay IV",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates:
        {
          lat: 1309823,
          lng: 321123
        }
    },

    media: [
      {
        id: 1,
        type: "image",
        url: "https://prod.rockmedialibrary.com/api/public/content/ff061825fa8e44bf8108de5c786c0062?v=4c4f7c7a",
        isPrimary: true,
      },
    ],

    features: [
      { name: "Market", key: "store" },
      { name: "University", key: "school" },
      { name: "Hospital", key: "hospital" },
      { name: "Main Road", key: "road" },
    ],

    amenities: [
      { name: "Elevator", key: "elevator" },
      { name: "24/7 Security", key: "security" }
    ],

    lotArea: 1200,

    details:
      "Spacious lot located in the heart of Vigan City, ideal for residential or commercial development.",
  },

  {
    id: 4,
    title: "Residential Lot in Barangay I",
    type: "lot",
    status: "available",
    price: 450000,
    createdAt: "2026-03-07",

    location: {
      address: "321 Elm St",
      barangay: "Barangay I",
      city: "Vigan City",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates:
        {
          lat: 234321,
          lng: 321321
        }
    },

    media: [
      {
        id: 1,
        type: "image",
        url: "https://media.istockphoto.com/id/2155879454/photo/this-is-an-exterior-photo-of-a-home-for-sale-in-beverly-hills-ca.jpg?s=612x612&w=0&k=20&c=uSKacMQvmaYX5Pf5Br7pUfErYQbNt_UWXRTjfwrdSDQ=",
        isPrimary: true,
      },
    ],

    features: [{ name: "Parking", key: "parking" }],

    amenities: [
      { name: "Swimming Pool", key: "pool" }
    ],

    lotArea: 1400,

    details:
      "Spacious lot located in the heart of Vigan City, ideal for residential or commercial development.",
  },

  {
    id: 5,
    title: "Bantay Development Lot",
    type: "lot",
    status: "available",
    price: 275000,
    createdAt: "2026-03-07",
    updatedAt: "2026-03-07",

    location: {
      address: "654 Maple Dr",
      barangay: "Barangay III",
      city: "Bantay",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates:
        {
          lat: 678678,
          lng: 63456
        }
    },

    media: [
      {
        id:1,
        type: "image",
        url: "https://placehold.co/300x200",
        isPrimary: true,
      },
    ],

    features: //Accessibilities  
     [
      { name: "Beach Spot", key: "beach" },
      { name: "Market", key: "store" },
      { name: "University", key: "school" },
      { name: "Hospital", key: "hospital" },
      { name: "Main Road", key: "road" },
    ],

    amenities: [
      { name: "Gym", key: "gym" },
      { name: "Elevator", key: "elevator" }
    ],

    lotArea: 1600,

    details:
      "Spacious lot located in the heart of Bantay, ideal for residential or commercial development.",
  },

  {
    id:6,
    title: "Large Lot in Magsingal",
    type: "lot",
    status: "available",
    price: 380000,
    createdAt: "2026-03-07",
    updatedAt: "2026-03-07",

    location: {
      address: "987 Cedar Ln",
      barangay: "Bayubay",
      city: "Magsingal",
      province: "Ilocos Sur",
      country: "Philippines",
      coordinates:
        {
          lat: 123678,
          lng: 321678
        }
    },

    media: [
      {
        id: 1,
        type: "image",
        url: "https://placehold.co/300x200",
        isPrimary: true,
      },
    ],

    features: [{ name: "Mall Nearby", key: "shopping" }],

    amenities: [
      { name: "24/7 Security", key: "security" },
      { name: "Swimming Pool", key: "pool" }
    ],

    lotArea: 2700,

    details:
      "Spacious lot located in the heart of Magsingal, ideal for residential or commercial development.",
  },
];
