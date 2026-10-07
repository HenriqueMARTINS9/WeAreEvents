const publicStorageMarker = "/storage/v1/object/public/";

export const getOptimizedImageUrl = (source: string, width: number, quality = 78) => {
  if (!source.includes(publicStorageMarker)) return source;

  const url = new URL(source);
  url.pathname = url.pathname.replace(publicStorageMarker, "/storage/v1/render/image/public/");
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality));
  url.searchParams.set("resize", "contain");
  return url.toString();
};

export const getResponsiveImageSrcSet = (source: string, widths = [480, 800, 1200]) => {
  if (!source.includes(publicStorageMarker)) return undefined;
  return widths.map((width) => `${getOptimizedImageUrl(source, width)} ${width}w`).join(", ");
};
