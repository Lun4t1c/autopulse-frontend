"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type WatchlistFilter = {
  id: string;
  brand: string;
  model?: string;
  fuel_type?: string;
  year_from?: number;
  year_to?: number;
  price_from?: number;
  price_to?: number;
  mileage_from?: number;
  mileage_to?: number;
  horsepower_from?: number;
  horsepower_to?: number;
  displacement_from?: number;
  displacement_to?: number;
};

const emptyForm = {
  brand: "",
  model: "",
  fuel_type: "",
  year_from: "",
  year_to: "",
  price_from: "",
  price_to: "",
  mileage_from: "",
  mileage_to: "",
  horsepower_from: "",
  horsepower_to: "",
  displacement_from: "",
  displacement_to: "",
};

const NUM_FIELDS = [
  "year_from", "year_to", "price_from", "price_to",
  "mileage_from", "mileage_to", "horsepower_from", "horsepower_to",
  "displacement_from", "displacement_to",
];

function toPayload(form: typeof emptyForm) {
  const result: Record<string, string | number> = {};
  Object.entries(form).forEach(([k, v]) => {
    if (!v) return;
    result[k] = NUM_FIELDS.includes(k) ? Number(v) : v;
  });
  return result;
}

function filterToForm(f: WatchlistFilter): typeof emptyForm {
  return {
    brand: f.brand ?? "",
    model: f.model ?? "",
    fuel_type: f.fuel_type ?? "",
    year_from: f.year_from?.toString() ?? "",
    year_to: f.year_to?.toString() ?? "",
    price_from: f.price_from?.toString() ?? "",
    price_to: f.price_to?.toString() ?? "",
    mileage_from: f.mileage_from?.toString() ?? "",
    mileage_to: f.mileage_to?.toString() ?? "",
    horsepower_from: f.horsepower_from?.toString() ?? "",
    horsepower_to: f.horsepower_to?.toString() ?? "",
    displacement_from: f.displacement_from?.toString() ?? "",
    displacement_to: f.displacement_to?.toString() ?? "",
  };
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65716c]">
        {label}
      </span>
      <input
        className="h-9 rounded-md border border-[#cfc7b8] bg-white px-3 text-sm outline-none focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  );
}

function FilterForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: WatchlistFilter;
  onSubmit: (payload: Record<string, string | number>) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial ? filterToForm(initial) : emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand) { setError("Brand is required"); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit(toPayload(form));
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-[#d8d1c4] bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Brand *" value={form.brand} onChange={set("brand")} placeholder="e.g. toyota" />
        <Field label="Model" value={form.model} onChange={set("model")} placeholder="e.g. celica" />
        <Field label="Fuel type" value={form.fuel_type} onChange={set("fuel_type")} placeholder="e.g. petrol" />
        <Field label="Year from" value={form.year_from} onChange={set("year_from")} type="number" placeholder="e.g. 1995" />
        <Field label="Year to" value={form.year_to} onChange={set("year_to")} type="number" placeholder="e.g. 2006" />
        <Field label="Price from (PLN)" value={form.price_from} onChange={set("price_from")} type="number" />
        <Field label="Price to (PLN)" value={form.price_to} onChange={set("price_to")} type="number" />
        <Field label="Mileage from (km)" value={form.mileage_from} onChange={set("mileage_from")} type="number" />
        <Field label="Mileage to (km)" value={form.mileage_to} onChange={set("mileage_to")} type="number" />
        <Field label="HP from" value={form.horsepower_from} onChange={set("horsepower_from")} type="number" />
        <Field label="HP to" value={form.horsepower_to} onChange={set("horsepower_to")} type="number" />
        <Field label="Displacement from (cc)" value={form.displacement_from} onChange={set("displacement_from")} type="number" />
        <Field label="Displacement to (cc)" value={form.displacement_to} onChange={set("displacement_to")} type="number" />
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="h-9 rounded-md bg-[#244c45] px-4 text-sm font-semibold text-white hover:bg-[#1b3934] disabled:opacity-50"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-md border border-[#cfc7b8] px-4 text-sm font-semibold text-[#34423d] hover:border-[#9f9587]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function FilterRow({
  filter, onDelete, onEdit,
}: {
  filter: WatchlistFilter;
  onDelete: (id: string) => void;
  onEdit: (filter: WatchlistFilter) => void;
}) {
  const tags = [
    filter.fuel_type,
    filter.year_from || filter.year_to
      ? `${filter.year_from ?? "?"} – ${filter.year_to ?? "?"}`
      : null,
    filter.price_from || filter.price_to
      ? `${filter.price_from?.toLocaleString("pl-PL") ?? "?"} – ${filter.price_to?.toLocaleString("pl-PL") ?? "?"} PLN`
      : null,
    filter.mileage_from || filter.mileage_to
      ? `${filter.mileage_from?.toLocaleString("pl-PL") ?? "?"} – ${filter.mileage_to?.toLocaleString("pl-PL") ?? "?"} km`
      : null,
    filter.horsepower_from || filter.horsepower_to
      ? `${filter.horsepower_from ?? "?"} – ${filter.horsepower_to ?? "?"} hp`
      : null,
    filter.displacement_from || filter.displacement_to
      ? `${filter.displacement_from ?? "?"} – ${filter.displacement_to ?? "?"} cc`
      : null,
  ].filter(Boolean);

  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-[#d8d1c4] bg-white px-4 py-3">
      <div>
        <span className="font-semibold text-[#1c2421]">
          {filter.brand}{filter.model ? ` / ${filter.model}` : " / all models"}
        </span>
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span key={i} className="rounded-full border border-[#d8d1c4] px-2 py-0.5 text-xs text-[#65716c]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => onEdit(filter)}
          className="h-8 rounded-md border border-[#cfc7b8] px-3 text-xs font-semibold text-[#34423d] hover:border-[#9f9587]"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(filter.id)}
          className="h-8 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-600 hover:border-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState<WatchlistFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFilter, setEditingFilter] = useState<WatchlistFilter | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading]);

  const fetchWatchlist = async () => {
    setLoading(true);
    const res = await apiFetch("/watchlists");
    if (res.ok) {
      const data = await res.json();
      setFilters(data.filters ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchWatchlist();
  }, [user]);

  const handleAdd = async (payload: Record<string, string | number>) => {
    const res = await apiFetch("/watchlists/filters", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    setShowAddForm(false);
    fetchWatchlist();
  };

  const handleUpdate = async (id: string, payload: Record<string, string | number>) => {
    const res = await apiFetch(`/watchlists/filters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    setEditingFilter(null);
    fetchWatchlist();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this filter?")) return;
    await apiFetch(`/watchlists/filters/${id}`, { method: "DELETE" });
    fetchWatchlist();
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-8">
        <p className="text-sm text-[#65716c]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3ee]">
      <section className="border-b border-[#d8d1c4] bg-[#fdfbf7]">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div>
            <h1 className="text-2xl font-semibold text-[#1c2421]">My Watchlist</h1>
            <p className="mt-1 text-sm text-[#65716c]">
              {filters.length} filter{filters.length !== 1 ? "s" : ""} — matching offers are highlighted in the main list.
            </p>
          </div>
          {!showAddForm && !editingFilter && (
            <button
              onClick={() => setShowAddForm(true)}
              className="h-9 rounded-md bg-[#244c45] px-4 text-sm font-semibold text-white hover:bg-[#1b3934]"
            >
              + Add filter
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 lg:px-10 flex flex-col gap-4">
        {showAddForm && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#65716c]">
              New filter
            </h2>
            <FilterForm
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
              submitLabel="Add filter"
            />
          </div>
        )}

        {filters.length === 0 && !showAddForm ? (
          <div className="rounded-md border border-[#d8d1c4] bg-white px-5 py-8 text-center">
            <p className="text-sm text-[#65716c]">No filters yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 h-9 rounded-md bg-[#244c45] px-4 text-sm font-semibold text-white hover:bg-[#1b3934]"
            >
              Add your first filter
            </button>
          </div>
        ) : (
          filters.map((f) =>
            editingFilter?.id === f.id ? (
              <div key={f.id}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#65716c]">
                  Editing: {f.brand}{f.model ? ` / ${f.model}` : ""}
                </h2>
                <FilterForm
                  initial={f}
                  onSubmit={(payload) => handleUpdate(f.id, payload)}
                  onCancel={() => setEditingFilter(null)}
                  submitLabel="Save changes"
                />
              </div>
            ) : (
              <FilterRow
                key={f.id}
                filter={f}
                onDelete={handleDelete}
                onEdit={setEditingFilter}
              />
            )
          )
        )}
      </section>
    </main>
  );
}