export type Offer = {
  id: string;
  offer_id: string;
  url: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  price: number | null;
  currency: string | null;
  mileage: number | null;
  fuel_type: string | null;
  gearbox: string | null;
  displacement: number | null;
  horsepower: number | null;
  body: string | null;
  color: string | null;
  door_count: number | null;
  generation: string | null;
  version: string | null;
  wheel_drive: string | null;
  first_seen: string | null;
};

export type OfferFilters = {
  q?: string;
  brand?: string;
  model?: string;
  fuel_type?: string;
  gearbox?: string;
  body?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  sort?: OfferSort;
  page?: number;
};

export type OfferScope = "today" | "all";

export type OfferSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "mileage_asc"
  | "power_desc";

export type OfferStats = {
  total: number;
  priced: number;
  averagePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  averageMileage: number | null;
};

export type OfferQueryResult = {
  configured: boolean;
  scope: OfferScope;
  offers: Offer[];
  options: {
    brands: string[];
    models: string[];
    fuelTypes: string[];
    gearboxes: string[];
    bodies: string[];
  };
  stats: OfferStats;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
};