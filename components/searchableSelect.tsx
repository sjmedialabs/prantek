"use client";

import * as React from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  email?: string;
  phone?: string;
};

interface SearchableSelectProps {
  options: Option[];
  value: string; // currently selected value
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function OwnSearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Search and select…",
  emptyText = "No results found.",
  className,
}: SearchableSelectProps) {
  const [query, setQuery] = React.useState("");

const filtered = React.useMemo(() => {
  if (!query) return options;

  const q = query.toLowerCase();

  return options.filter((o) => {
    return (
      o.label?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone?.toLowerCase().includes(q)
    );
  });
}, [options, query]);

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  return (
    <Combobox
      value={value}
      onChange={(val: string) => {
        onValueChange(val);
        setQuery(""); // clear the search after selecting
      }}
      nullable
    >
      {({ open }) => (
        <div className={cn("relative w-full", className)}>
          {/* The input itself acts as the trigger and the search box */}
          <div className="relative w-full">
            <Combobox.Input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              displayValue={(val: string) =>
                options.find((o) => o.value === val)?.label ?? ""
              }
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </Combobox.Button>
          </div>

          <Transition
            show={open}
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-gray-500">{emptyText}</div>
              ) : (
                filtered.map((opt) => (
                  <Combobox.Option
                    key={opt.value + opt.label}
                    value={opt.value}
                    className={({ active }) =>
                      cn(
                        "relative flex cursor-default select-none items-center px-3 py-2",
                        active ? "bg-indigo-600 text-white" : "text-gray-900"
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={cn(
                            "block truncate",
                            selected ? "font-medium" : "font-normal"
                          )}
                        >
                          {opt.label}
                        </span>
                        {value === opt.value && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      )}
    </Combobox>
  );
}
