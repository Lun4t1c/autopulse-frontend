import Link from "next/link";
import { parseOfferSearchParams } from "@/lib/offer-search";
import { getOffers, type OfferFilters, type OfferSort } from "@/lib/offers";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions: Array<{ value: OfferSort; label: string }> = [
  { value: "newest", label: "Newest scraped" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" },
  { value: "year_desc", label: "Newest year" },
  { value: "mileage_asc", label: "Lowest mileage" },
  { value: "power_desc", label: "Highest power" },
];

function formatMoney(value: number | null, currency = "PLN") {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null, suffix = "") {
  if (value === null) {
    return "-";
  }

  return `${new Intl.NumberFormat("pl-PL").format(Math.round(value))}${suffix}`;
}

function option(value: string, selected?: string) {
  return (
    <option key={value} value={value}>
      {value === selected ? `${value}` : value}
    </option>
  );
}

function hiddenFilters(filters: OfferFilters, page: number) {
  return Object.entries({ ...filters, page }).flatMap(([key, value]) => {
    if (value === undefined || value === "") {
      return [];
    }

    return <input key={key} type="hidden" name={key} value={String(value)} />;
  });
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const { filters, scope } = parseOfferSearchParams(params);
  const result = await getOffers(filters, scope);
  const currency = result.offers.find((offer) => offer.currency)?.currency ?? "PLN";
  const viewLabel = result.scope === "today" ? "Today feed" : "Filtered search";
  const viewDescription =
    result.scope === "today"
      ? "Showing offers first seen today by default."
      : "Showing offers matching your filters across all dates.";

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
                Browse scraped offers from MongoDB, narrow the dataset, and compare the
                fields that matter for pricing and quality checks.
              </p>
              <div className="mt-4 inline-flex rounded-full border border-[#d8d1c4] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2f6f62]">
                {viewLabel}
              </div>
              <p className="mt-2 text-sm text-[#65716c]">{viewDescription}</p>
            </div>
            <div className="rounded-md border border-[#d8d1c4] bg-white px-4 py-3 text-sm text-[#46524d]">
              <span className="block text-xs uppercase tracking-[0.14em] text-[#7a837f]">
                Source
              </span>
              <span className="font-medium text-[#1c2421]">{result.collectionLabel}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat
              label={result.scope === "today" ? "Today's offers" : "Matching offers"}
              value={formatNumber(result.stats.total)}
            />
            <Stat label="With price" value={formatNumber(result.stats.priced)} />
            <Stat label="Avg price" value={formatMoney(result.stats.averagePrice, currency)} />
            <Stat label="Price range" value={`${formatMoney(result.stats.minPrice, currency)} - ${formatMoney(result.stats.maxPrice, currency)}`} />
            <Stat label="Avg mileage" value={formatNumber(result.stats.averageMileage, " km")} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <form
          className="grid gap-3 border-b border-[#d8d1c4] pb-6 md:grid-cols-4 xl:grid-cols-8"
          action="/"
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

          <Select label="Brand" name="brand" value={filters.brand} values={result.options.brands} />
          <Select label="Model" name="model" value={filters.model} values={result.options.models} />
          <Select label="Fuel" name="fuel_type" value={filters.fuel_type} values={result.options.fuelTypes} />
          <Select label="Gearbox" name="gearbox" value={filters.gearbox} values={result.options.gearboxes} />
          <Select label="Body" name="body" value={filters.body} values={result.options.bodies} />

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
            <button
              className="h-10 rounded-md bg-[#244c45] px-5 text-sm font-semibold text-white transition hover:bg-[#1b3934]"
              type="submit"
            >
              Apply filters
            </button>
            <Link
              className="flex h-10 items-center rounded-md border border-[#cfc7b8] bg-white px-4 text-sm font-semibold text-[#34423d] transition hover:border-[#9f9587]"
              href="/"
            >
              Reset
            </Link>
          </div>
        </form>

        {!result.configured ? (
          <Notice
            title="Connect MongoDB"
            message="Add MONGODB_URI and MONGODB_DB to your environment. Optionally set MONGODB_COLLECTION if your collection is not named offers."
          />
        ) : result.error ? (
          <Notice title="MongoDB query failed" message={result.error} />
        ) : result.offers.length === 0 ? (
          <Notice
            title="No offers found"
            message={
              result.scope === "today"
                ? "No offers were first seen today yet. Try again later or use filters to switch into search mode."
                : "Adjust filters or check whether the scraper has inserted documents into this collection."
            }
          />
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
                  {result.offers.map((offer) => (
                    <tr key={offer.id} className="border-t border-[#e5ded2] align-top">
                      <Td>
                        <a
                          className="font-semibold text-[#244c45] underline-offset-4 hover:underline"
                          href={offer.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {offer.title ?? offer.offer_id}
                        </a>
                        <span className="mt-1 block text-xs text-[#7a837f]">{offer.offer_id}</span>
                      </Td>
                      <Td>
                        <span className="font-medium">{[offer.brand, offer.model].filter(Boolean).join(" ") || "-"}</span>
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
                        {offer.displacement ? `${formatNumber(offer.displacement, " cm3")}` : "-"}
                        <span className="mt-1 block text-xs text-[#7a837f]">
                          {offer.horsepower ? `${formatNumber(offer.horsepower, " hp")}` : "-"}
                        </span>
                      </Td>
                      <Td>{offer.body ?? "-"}</Td>
                      <Td>{offer.wheel_drive ?? "-"}</Td>
                      <Td>{offer.color ?? "-"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 text-sm text-[#5f6964] sm:flex-row sm:items-center">
              <span>
                Page {result.page} of {result.totalPages}, showing {result.offers.length} of{" "}
                {result.stats.total} {result.scope === "today" ? "today's offers" : "matching offers"}
              </span>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <form action="/">
                    {hiddenFilters(filters, result.page - 1)}
                    <button className="h-10 rounded-md border border-[#cfc7b8] bg-white px-4 font-semibold text-[#34423d]">
                      Previous
                    </button>
                  </form>
                ) : null}
                {result.page < result.totalPages ? (
                  <form action="/">
                    {hiddenFilters(filters, result.page + 1)}
                    <button className="h-10 rounded-md border border-[#cfc7b8] bg-white px-4 font-semibold text-[#34423d]">
                      Next
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-white px-4 py-3">
      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#65716c]">
        {label}
      </span>
      <span className="mt-1 block text-xl font-semibold text-[#1c2421]">{value}</span>
    </div>
  );
}

function Select({
  label,
  name,
  value,
  values,
}: {
  label: string;
  name: string;
  value?: string;
  values: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65716c]">
        {label}
      </span>
      <select
        className="h-10 rounded-md border border-[#cfc7b8] bg-white px-3 text-sm outline-none transition focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
        name={name}
        defaultValue={value ?? ""}
      >
        <option value="">All</option>
        {values.map((item) => option(item, value))}
      </select>
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
