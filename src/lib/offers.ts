import "server-only";

import { MongoClient, type Collection, type Document, type Filter, type Sort } from "mongodb";

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

type OptionGroup = {
  brands: string[];
  models: string[];
  fuelTypes: string[];
  gearboxes: string[];
  bodies: string[];
};

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
  collectionLabel: string;
  scope: OfferScope;
  offers: Offer[];
  options: OptionGroup;
  stats: OfferStats;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
};

const PAGE_SIZE = 25;

const sortMap: Record<OfferSort, Sort> = {
  newest: { _id: -1 },
  price_asc: { price: 1, _id: -1 },
  price_desc: { price: -1, _id: -1 },
  year_desc: { year: -1, _id: -1 },
  mileage_asc: { mileage: 1, _id: -1 },
  power_desc: { horsepower: -1, _id: -1 },
};

let cachedClient: MongoClient | null = null;

function getConfig() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB ?? process.env.MONGODB_DATABASE;
  const collectionName =
    process.env.MONGODB_COLLECTION ?? process.env.MONGODB_OFFERS_COLLECTION ?? "offers";

  return {
    uri,
    dbName,
    collectionName,
    configured: Boolean(uri && dbName),
  };
}

async function getClient(uri: string) {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
  }

  return cachedClient.connect();
}

function numberFilter(min?: number, max?: number) {
  const filter: Record<string, number> = {};

  if (typeof min === "number") {
    filter.$gte = min;
  }

  if (typeof max === "number") {
    filter.$lte = max;
  }

  return Object.keys(filter).length ? filter : undefined;
}

function getTodayFilter() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const tomorrow = new Date(start);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    first_seen: { $gte: start, $lt: tomorrow },
  };
}

function buildQuery(filters: OfferFilters, scope: OfferScope): Filter<Document> {
  const conditions: Filter<Document>[] = [];

  if (filters.q) {
    const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    conditions.push({
      $or: [
        { title: { $regex: escaped, $options: "i" } },
        { brand: { $regex: escaped, $options: "i" } },
        { model: { $regex: escaped, $options: "i" } },
        { offer_id: { $regex: escaped, $options: "i" } },
      ],
    });
  }

  for (const field of ["brand", "model", "fuel_type", "gearbox", "body"] as const) {
    if (filters[field]) {
      conditions.push({ [field]: filters[field] });
    }
  }

  const price = numberFilter(filters.minPrice, filters.maxPrice);
  if (price) {
    conditions.push({ price });
  }

  const year =
    filters.minYear != null || filters.maxYear != null
      ? {
          ...(filters.minYear != null ? { $gte: String(filters.minYear) } : {}),
          ...(filters.maxYear != null ? { $lte: String(filters.maxYear) } : {}),
        }
      : undefined;

  if (year) {
    conditions.push({ year });
  }

  if (scope === "today") {
    conditions.push(getTodayFilter());
  }

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function serializeOffer(doc: Document): Offer {
  return {
    id: doc._id?.toString() ?? "",
    offer_id: String(doc.offer_id ?? ""),
    url: String(doc.url ?? ""),
    title: toStringOrNull(doc.title),
    brand: toStringOrNull(doc.brand),
    model: toStringOrNull(doc.model),
    year: toStringOrNull(doc.year),
    price: toNumber(doc.price),
    currency: toStringOrNull(doc.currency),
    mileage: toNumber(doc.mileage),
    fuel_type: toStringOrNull(doc.fuel_type),
    gearbox: toStringOrNull(doc.gearbox),
    displacement: toNumber(doc.displacement),
    horsepower: toNumber(doc.horsepower),
    body: toStringOrNull(doc.body),
    color: toStringOrNull(doc.color),
    door_count: toNumber(doc.door_count),
    generation: toStringOrNull(doc.generation),
    version: toStringOrNull(doc.version),
    wheel_drive: toStringOrNull(doc.wheel_drive),
  };
}

async function getDistinctOptions(collection: Collection<Document>) {
  const [brands, models, fuelTypes, gearboxes, bodies] = await Promise.all([
    collection.distinct("brand", { brand: { $type: "string", $ne: "" } }),
    collection.distinct("model", { model: { $type: "string", $ne: "" } }),
    collection.distinct("fuel_type", { fuel_type: { $type: "string", $ne: "" } }),
    collection.distinct("gearbox", { gearbox: { $type: "string", $ne: "" } }),
    collection.distinct("body", { body: { $type: "string", $ne: "" } }),
  ]);

  return {
    brands: brands.sort(),
    models: models.sort(),
    fuelTypes: fuelTypes.sort(),
    gearboxes: gearboxes.sort(),
    bodies: bodies.sort(),
  };
}

export async function getOffers(filters: OfferFilters, scope: OfferScope = "today"): Promise<OfferQueryResult> {
  const config = getConfig();
  const page = Math.max(1, filters.page ?? 1);
  const sort = sortMap[filters.sort ?? "newest"];
  console.log('getting offers...');

  if (!config.configured || !config.uri || !config.dbName) {
    return {
      configured: false,
      collectionLabel: "MongoDB not configured",
      scope,
      offers: [],
      options: { brands: [], models: [], fuelTypes: [], gearboxes: [], bodies: [] },
      stats: {
        total: 0,
        priced: 0,
        averagePrice: null,
        minPrice: null,
        maxPrice: null,
        averageMileage: null,
      },
      page,
      pageSize: PAGE_SIZE,
      totalPages: 1,
    };
  }

  try {
    const client = await getClient(config.uri);
    const collection = client.db(config.dbName).collection(config.collectionName);
    const query = buildQuery(filters, scope);

    const [offers, total, statsRows, options] = await Promise.all([
      collection
        .find(query)
        .sort(sort)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray(),
      collection.countDocuments(query),
      collection
        .aggregate<{
          priced: number;
          averagePrice: number | null;
          minPrice: number | null;
          maxPrice: number | null;
          averageMileage: number | null;
        }>([
          { $match: query },
          {
            $group: {
              _id: null,
              priced: { $sum: { $cond: [{ $ne: ["$price", null] }, 1, 0] } },
              averagePrice: { $avg: "$price" },
              minPrice: { $min: "$price" },
              maxPrice: { $max: "$price" },
              averageMileage: { $avg: "$mileage" },
            },
          },
        ])
        .toArray(),
      getDistinctOptions(collection),
    ]);

    const stats = statsRows[0];

    return {
      configured: true,
      collectionLabel: `${config.dbName}.${config.collectionName}`,
      scope,
      offers: offers.map(serializeOffer),
      options,
      stats: {
        total,
        priced: stats?.priced ?? 0,
        averagePrice: stats?.averagePrice ?? null,
        minPrice: stats?.minPrice ?? null,
        maxPrice: stats?.maxPrice ?? null,
        averageMileage: stats?.averageMileage ?? null,
      },
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  } catch (error) {
    return {
      configured: true,
      collectionLabel: `${config.dbName}.${config.collectionName}`,
      scope,
      offers: [],
      options: { brands: [], models: [], fuelTypes: [], gearboxes: [], bodies: [] },
      stats: {
        total: 0,
        priced: 0,
        averagePrice: null,
        minPrice: null,
        maxPrice: null,
        averageMileage: null,
      },
      page,
      pageSize: PAGE_SIZE,
      totalPages: 1,
      error: error instanceof Error ? error.message : "Unknown MongoDB error",
    };
  }
}
