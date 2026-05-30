import { type OfferFilters, type OfferScope, type OfferSort } from "@/lib/offers";

type SearchParam = string | string[] | undefined;

type SearchParams = Record<string, SearchParam>;

const validSorts: OfferSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "year_desc",
  "mileage_asc",
  "power_desc",
];

const validSortSet = new Set<OfferSort>(validSorts);

function isOfferSort(value: string | undefined): value is OfferSort {
  return typeof value === "string" && validSortSet.has(value as OfferSort);
}

function first(value: SearchParam) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: SearchParam) {
  const v = first(value);
  if (!v) return undefined;

  const parsed = Number(v);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function hasActiveFilter(filters: OfferFilters) {
  return Boolean(
    filters.q ||
      filters.brand ||
      filters.model ||
      filters.fuel_type ||
      filters.gearbox ||
      filters.body ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.minYear != null ||
      filters.maxYear != null,
  );
}

export type ParsedOfferSearch = {
  filters: OfferFilters;
  scope: OfferScope;
};

export function parseOfferSearchParams(params: SearchParams): ParsedOfferSearch {
  const sort = first(params.sort);
  const filters: OfferFilters = {
    q: first(params.q),
    brand: first(params.brand),
    model: first(params.model),
    fuel_type: first(params.fuel_type),
    gearbox: first(params.gearbox),
    body: first(params.body),
    minPrice: numberParam(params.minPrice),
    maxPrice: numberParam(params.maxPrice),
    minYear: numberParam(params.minYear),
    maxYear: numberParam(params.maxYear),
    sort: isOfferSort(sort) ? sort : "newest",
    page: numberParam(params.page),
  };

  return {
    filters,
    scope: hasActiveFilter(filters) ? "all" : "today",
  };
}
