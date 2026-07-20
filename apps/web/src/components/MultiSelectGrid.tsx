"use client";

import type { CatalogItem } from "@/lib/api";

// Grid de seleção múltipla com checkmark — mesmo padrão visual do
// MultiSelectButton/BannerSelector/InterestSelector do protótipo gerado
// à parte, adaptado para consumir o catálogo real (GET /bandeiras,
// GET /interesses) em vez de uma lista fixa embutida no componente.
export function MultiSelectGrid({
  items,
  selectedIds,
  onChange,
  maxSelections,
}: {
  items: CatalogItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections: number;
}) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < maxSelections) {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              disabled={!selected && selectedIds.length >= maxSelections}
              className={`relative flex items-center justify-center text-center px-3 py-2 rounded-lg border-2 text-xs font-body transition-colors ${
                selected
                  ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700"
                  : "border-linen-300 bg-white hover:border-linen-400 disabled:opacity-50"
              }`}
            >
              {selected && <span className="absolute top-1 right-1 text-terracotta-600">✓</span>}
              {item.name}
            </button>
          );
        })}
      </div>
      <p className="text-xs font-body text-embroidery-gray">
        {selectedIds.length}/{maxSelections} selecionadas
      </p>
    </div>
  );
}
