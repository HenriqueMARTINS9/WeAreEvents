const publicStorageMarker = "/storage/v1/object/public/";
const supportedImagePattern = /\.(?:avif|jpe?g|png|webp)(?:[?#]|$)/i;

export const getSupabaseTransformedImageUrl = (src: string, width: number) => {
  if (!src.includes(publicStorageMarker) || !supportedImagePattern.test(src)) return src;

  const transformedUrl = new URL(src.replace(publicStorageMarker, "/storage/v1/render/image/public/"));
  transformedUrl.searchParams.set("width", String(width));
  transformedUrl.searchParams.set("quality", "76");
  return transformedUrl.href;
};

export const getResponsiveImageProps = (src: string, sizes: string) => {
  const transformedSource = getSupabaseTransformedImageUrl(src, 1200);
  if (transformedSource === src) return { src, sizes };

  return {
    src: transformedSource,
    srcSet: [480, 800, 1200]
      .map((width) => `${getSupabaseTransformedImageUrl(src, width)} ${width}w`)
      .join(", "),
    sizes,
  };
};
