type SearchFilterValue = string | number | Array<string | number> | undefined;

export type SearchLinkFilters = Record<string, SearchFilterValue>;

export const buildSearchUrl = (filters: SearchLinkFilters, hash = "salles") => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;

    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => {
      if (item === undefined || item === "") return;
      params.append(key, String(item));
    });
  });

  const query = params.toString();
  return `/recherche${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};
