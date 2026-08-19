"use client";

import { useActionState, useMemo, useState } from "react";
import { FiCheck, FiSearch } from "react-icons/fi";
import { saveListeningPreferencesAction } from "./actions";
import type { ListeningPreferences } from "@/features/preferences/server";
import type { Language } from "@/features/dawahcast/server/languages";
import type { LecturerListItem } from "@/features/dawahcast/server/listings";

type Props = {
  initialPreferences: ListeningPreferences;
  languages: Language[];
  lecturers: LecturerListItem[];
};

const toggle = (items: number[], id: number) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];

export function ListeningPreferencesForm({
  initialPreferences,
  languages,
  lecturers,
}: Props) {
  const [state, action, pending] = useActionState(saveListeningPreferencesAction, {});
  const [languageIds, setLanguageIds] = useState(initialPreferences.languageIds);
  const [lecturerIds, setLecturerIds] = useState(initialPreferences.lecturerIds);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const visibleLecturers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const matching = normalized
      ? lecturers.filter((lecturer) => lecturer.name.toLocaleLowerCase().includes(normalized))
      : [...lecturers].sort((a, b) => {
          const aSelected = lecturerIds.includes(Number(a.id));
          const bSelected = lecturerIds.includes(Number(b.id));
          return Number(bSelected) - Number(aSelected);
        });
    return matching.slice(0, normalized || expanded ? 80 : 30);
  }, [expanded, lecturerIds, lecturers, query]);

  const selectedCount = languageIds.length + lecturerIds.length;

  return (
    <form action={action} className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      {languageIds.map((id) => (
        <input key={`language-${id}`} type="hidden" name="languageIds" value={id} />
      ))}
      {lecturerIds.map((id) => (
        <input key={`lecturer-${id}`} type="hidden" name="lecturerIds" value={id} />
      ))}

      <div>
        <h3 className="text-sm font-semibold text-foreground">Languages</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Home will include lectures matching any selected language or scholar.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {languages.map((language) => {
            const selected = languageIds.includes(language.id);
            return (
              <button
                key={language.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setLanguageIds((items) => toggle(items, language.id))}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-dncolor-500 bg-dncolor-500 text-black"
                    : "border-border bg-background text-foreground hover:bg-hover"
                }`}
              >
                {selected ? <FiCheck aria-hidden /> : null}
                {language.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Scholars</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search the full resource-person catalogue. This is optional.
            </p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {lecturerIds.length} selected
          </span>
        </div>

        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-input px-3 focus-within:ring-2 focus-within:ring-ring">
          <FiSearch aria-hidden className="text-muted-foreground" />
          <span className="sr-only">Search scholars</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search nearly 300 scholars"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleLecturers.map((lecturer) => {
            const id = Number(lecturer.id);
            const selected = lecturerIds.includes(id);
            return (
              <button
                key={String(lecturer.id)}
                type="button"
                aria-pressed={selected}
                onClick={() => setLecturerIds((items) => toggle(items, id))}
                className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  selected
                    ? "border-dncolor-500 bg-dncolor-500/10 text-foreground"
                    : "border-border bg-background text-foreground hover:bg-hover"
                }`}
              >
                <span className="line-clamp-2">{lecturer.name}</span>
                {selected ? (
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-dncolor-500 text-black">
                    <FiCheck aria-hidden size={13} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {!query && lecturers.length > visibleLecturers.length ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 min-h-11 text-sm font-semibold text-foreground underline underline-offset-4"
          >
            {expanded ? "Show fewer scholars" : "Show more scholars"}
          </button>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="mt-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-5 rounded-lg bg-hover px-3 py-2 text-sm text-foreground">
          Your Home feed has been updated.
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-5">
        <span className="text-sm tabular-nums text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? "choice" : "choices"}
        </span>
        <button
          type="submit"
          disabled={pending || selectedCount === 0}
          className="min-h-11 rounded-full bg-dncolor-500 px-5 py-2 text-sm font-bold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save listening preferences"}
        </button>
      </div>
    </form>
  );
}
