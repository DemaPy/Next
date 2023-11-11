"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const debounce = (fn: (value: React.ChangeEvent<HTMLInputElement>) => void, ms: number = 300) => {
    let id: NodeJS.Timeout | null = null
    let isFired: boolean = false

    return (arg: React.ChangeEvent<HTMLInputElement>) => {
      if (!isFired) {
        id = setTimeout(() => {
          fn(arg)
          isFired = false
        }, ms)
        isFired = true
      } else {
        if (id) {
          clearTimeout(id)
          isFired = false
        }
      }
    }
  }

  const handleSearch = debounce((ev: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (ev.target.value) {
      params.set("query", ev.target.value);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  })

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        defaultValue={searchParams.get("query")?.toString()}
        onChange={handleSearch}
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
