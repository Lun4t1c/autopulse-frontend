"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type { Offer, OfferFilters, OfferSort } from "@/lib/offers";
import { useSearchParams, useRouter } from "next/navigation";

const sortOptions: Array<{ value: OfferSort; label: string }> = [
  { value: "newest", label: "Newest scraped" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" },
  { value: "year_desc", label: "Newest year" },
  { value: "mileage_asc", label: "Lowest mileage" },
  { value: "power_desc", label: "Highest power" },
];

type ApiResult = {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  offers: Offer[];
};

function formatMoney(value: number | null, currency = "PLN") {
  if (value === null) return "-";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null, suffix = "") {
  if (value === null) return "-";
  return `${new Intl.NumberFormat("pl-PL").format(Math.round(value))}${suffix}`;
}

export default function Home() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [result, setResult] = useState<ApiResult | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const filters: OfferFilters = {
    q: searchParams.get("q") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    model: searchParams.get("model") ?? undefined,
    fuel_type: searchParams.get("fuel_type") ?? undefined,
    gearbox: searchParams.get("gearbox") ?? undefined,
    body: searchParams.get("body") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minYear: searchParams.get("minYear") ? Number(searchParams.get("minYear")) : undefined,
    maxYear: searchParams.get("maxYear") ? Number(searchParams.get("maxYear")) : undefined,
    sort: (searchParams.get("sort") as OfferSort) ?? "newest",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  };

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });

    const res = await apiFetch(`/offers?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    }
    setLoading(false);
  }, [searchParams]);

  const fetchWatchlistMatches = useCallback(async () => {
    if (!user) return;
    const res = await apiFetch("/watchlists/matched-ids");
    if (res.ok) {
      const ids: string[] = await res.json();
      setWatchlistIds(new Set(ids));
    }
  }, [user]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    fetchWatchlistMatches();
  }, [fetchWatchlistMatches]);

  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    form.forEach((value, key) => {
      if (value) params.set(key, String(value));
    });
    router.push(`/?${params.toString()}`);
  };

  const currency = result?.offers.find((o) => o.currency)?.currency ?? "PLN";

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#1e2523]">
      <section className="border-b border-[#d8d1c4] bg-[#fdfbf7]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#65716c]">
                Autopulse listings
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#1c2421] sm:text-4xl">
                Car offer analysis
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#65716c] sm:text-base">
                Browse scraped offers, narrow the dataset, and compare the fields that matter.
              </p>
            </div>
            {result && (
              <div className="rounded-md border border-[#d8d1c4] bg-white px-4 py-3 text-sm text-[#46524d]">
                <span className="block text-xs uppercase tracking-[0.14em] text-[#7a837f]">
                  Total offers
                </span>
                <span className="font-medium text-[#1c2421]">
                  {result.total.toLocaleString("pl-PL")}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <form
          onSubmit={applyFilters}
          className="grid gap-3 border-b border-[#d8d1c4] pb-6 md:grid-cols-4 xl:grid-cols-8"
        >
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65716c]">
              Search
            </span>
            <input
              className="h-10 rounded-md border border-[#cfc7b8] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
              name="q"
              defaultValue={filters.q}
              placeholder="title, brand, model, offer id"
            />
          </label>

          <Input label="Brand" name="brand" value={filters.brand} />
          <Input label="Model" name="model" value={filters.model} />
          <Input label="Fuel type" name="fuel_type" value={filters.fuel_type} />
          <Input label="Gearbox" name="gearbox" value={filters.gearbox} />
          <Input label="Body" name="body" value={filters.body} />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65716c]">
              Sort
            </span>
            <select
              className="h-10 rounded-md border border-[#cfc7b8] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
              name="sort"
              defaultValue={filters.sort}
            >
              {sortOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <NumberField label="Min price" name="minPrice" value={filters.minPrice} />
          <NumberField label="Max price" name="maxPrice" value={filters.maxPrice} />
          <NumberField label="Min year" name="minYear" value={filters.minYear} />
          <NumberField label="Max year" name="maxYear" value={filters.maxYear} />

          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-4">
  <button type="submit" className="h-10 rounded-md bg-[#244c45] px-5 text-sm font-semibold text-white hover:bg-[#1b3934]">
    Apply filters
  </button>
  <Link href="/" className="flex h-10 items-center rounded-md border border-[#cfc7b8] bg-white px-4 text-sm font-semibold text-[#34423d] hover:border-[#9f9587]">
    Reset
  </Link>
  <Link
    href={`/map?${searchParams.toString()}`}
    className="flex h-10 items-center rounded-md border border-[#cfc7b8] bg-white px-4 text-sm font-semibold text-[#34423d] hover:border-[#9f9587]"
  >
    🗺 Map
  </Link>
</div>
        </form>

        {loading ? (
          <div className="mt-10 text-center text-sm text-[#65716c]">Loading offers...</div>
        ) : !result || result.offers.length === 0 ? (
          <Notice title="No offers found" message="Adjust filters or try again later." />
        ) : (
          <>
            <div className="mt-6 overflow-x-auto border border-[#d8d1c4] bg-white">
              <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
                <thead className="bg-[#ebe6dc] text-xs uppercase tracking-[0.1em] text-[#5f6964]">
                  <tr>
                    <Th>Offer</Th>
                    <Th>Car</Th>
                    <Th>Year</Th>
                    <Th>Price</Th>
                    <Th>Mileage</Th>
                    <Th>Fuel</Th>
                    <Th>Gearbox</Th>
                    <Th>Engine</Th>
                    <Th>Body</Th>
                    <Th>Drive</Th>
                    <Th>Color</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.offers.map((offer, i) => {
                    const isMatch = watchlistIds.has(offer.offer_id);
                    return (
                      <tr
                        key={i}
                        className={`border-t border-[#e5ded2] align-top ${
                          isMatch ? "bg-[#f0faf5]" : ""
                        }`}
                      >
                        <Td>
                          <div className="flex items-start gap-2">
                            {isMatch && (
                              <span className="mt-0.5 shrink-0 rounded-full bg-[#2f6f62] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                Match
                              </span>
                            )}
                            <div>
                              <a
                                className="font-semibold text-[#244c45] underline-offset-4 hover:underline"
                                href={offer.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {offer.title ?? offer.offer_id}
                              </a>
                              <span className="mt-1 block text-xs text-[#7a837f]">
                                {offer.offer_id}
                              </span>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span className="font-medium">
                            {[offer.brand, offer.model].filter(Boolean).join(" ") || "-"}
                          </span>
                          <span className="mt-1 block text-xs text-[#7a837f]">
                            {[offer.generation, offer.version].filter(Boolean).join(" / ") || "-"}
                          </span>
                        </Td>
                        <Td>{offer.year ?? "-"}</Td>
                        <Td>{formatMoney(offer.price, offer.currency ?? currency)}</Td>
                        <Td>{formatNumber(offer.mileage, " km")}</Td>
                        <Td>{offer.fuel_type ?? "-"}</Td>
                        <Td>{offer.gearbox ?? "-"}</Td>
                        <Td>
                          {offer.displacement
                            ? formatNumber(offer.displacement, " cm3")
                            : "-"}
                          <span className="mt-1 block text-xs text-[#7a837f]">
                            {offer.horsepower
                              ? formatNumber(offer.horsepower, " hp")
                              : "-"}
                          </span>
                        </Td>
                        <Td>{offer.body ?? "-"}</Td>
                        <Td>{offer.wheel_drive ?? "-"}</Td>
                        <Td>{offer.color ?? "-"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 text-sm text-[#5f6964] sm:flex-row sm:items-center">
              <span>
                Page {result.page} of {result.total_pages}, showing {result.offers.length} of{" "}
                {result.total} offers
              </span>
              <div className="flex gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/?${new URLSearchParams({
                      ...Object.fromEntries(searchParams),
                      page: String(result.page - 1),
                    }).toString()}`}
                    className="flex h-10 items-center rounded-md border border-[#cfc7b8] bg-white px-4 font-semibold text-[#34423d]"
                  >
                    Previous
                  </Link>
                )}
                {result.page < result.total_pages && (
                  <Link
                    href={`/?${new URLSearchParams({
                      ...Object.fromEntries(searchParams),
                      page: String(result.page + 1),
                    }).toString()}`}
                    className="flex h-10 items-center rounded-md border border-[#cfc7b8] bg-white px-4 font-semibold text-[#34423d]"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Input({ label, name, value }: { label: string; name: string; value?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65716c]">
        {label}
      </span>
      <input
        className="h-10 rounded-md border border-[#cfc7b8] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
        name={name}
        defaultValue={value}
      />
    </label>
  );
}

function NumberField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65716c]">
        {label}
      </span>
      <input
        className="h-10 rounded-md border border-[#cfc7b8] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
        name={name}
        type="number"
        defaultValue={value}
      />
    </label>
  );
}

function Notice({ title, message }: { title: string; message: string }) {
  return (
    <div className="mt-6 border border-[#d8d1c4] bg-white px-5 py-6">
      <h2 className="text-lg font-semibold text-[#1c2421]">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65716c]">{message}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 text-[#34423d]">{children}</td>;
}