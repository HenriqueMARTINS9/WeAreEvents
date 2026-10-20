const siteUrl = (import.meta.env.VITE_SITE_URL || "https://www.wearevents.fr").replace(/\/$/, "");

export const notifyIndexNow = async (paths: string[], accessToken?: string | null) => {
  if (!accessToken || typeof window === "undefined") return false;

  const urls = Array.from(new Set(paths.filter(Boolean).map((path) => new URL(path, siteUrl).href)));
  if (!urls.length) return false;

  try {
    const response = await fetch("/api/indexnow", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      console.warn("Notification IndexNow refusée", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Notification IndexNow impossible", error);
    return false;
  }
};
