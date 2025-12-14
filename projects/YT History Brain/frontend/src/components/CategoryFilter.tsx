import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Programming: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "AI/ML": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Business: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Finance: "bg-green-500/20 text-green-400 border-green-500/30",
  Productivity: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Self-Improvement": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Health/Fitness": "bg-red-500/20 text-red-400 border-red-500/30",
  Entertainment: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Education: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  News: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Science: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  Design: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Marketing: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  Career: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Lifestyle: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  Gaming: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Music: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Travel: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Food: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Sports: "bg-green-500/20 text-green-400 border-green-500/30",
  Other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onChange,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter((c) => c !== category));
    } else {
      onChange([...selectedCategories, category]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange([...categories]);
  };

  const sortedCategories = [...categories].sort();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <span>Filter by Category</span>
        {selectedCategories.length > 0 && (
          <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
            {selectedCategories.length}
          </Badge>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg min-w-[220px] max-h-[400px] overflow-hidden">
          {/* Actions */}
          <div className="flex items-center justify-between p-2 border-b border-border">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </button>
          </div>

          {/* Category List */}
          <div className="overflow-y-auto max-h-[320px] p-1">
            {sortedCategories.map((category) => {
              const isSelected = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 text-left"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getCategoryColor(category)}`}
                  >
                    {category}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedCategories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className={`text-xs flex items-center gap-1 ${getCategoryColor(category)}`}
            >
              {category}
              <button
                onClick={() => toggleCategory(category)}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
