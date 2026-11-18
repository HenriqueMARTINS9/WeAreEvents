// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => ({
  ...await importOriginal<typeof import("node:fs/promises")>(),
  stat: vi.fn(async () => ({ isFile: () => true })),
  readFile: vi.fn(async () => '<!doctype html><html><head></head><body><div id="root">Stale prerender</div></body></html>'),
}));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE", "public-test-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function request(path: string, method = "GET", search = "") {
  const { default: handler } = await import("../../api/seo-render.js");
  const headers: Record<string, string> = {};
  const response = { statusCode: 0, setHeader: (key: string, value: string) => { headers[key] = value; }, end: vi.fn() };
  await handler({ method, url: `${path}${search}`, query: { path } }, response);
  return { ...response, headers };
}

describe("HTTP slug redirects", () => {
  it.each(["GET", "HEAD"])("sends a real 301 for %s before serving stale prerendered HTML", async (method) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ target_path: "/salle/nouveau-lieu" }] });
    const response = await request("/salle/ancien-lieu", method, "?utm_source=google&campaign=test");
    expect(response.statusCode).toBe(301);
    expect(response.headers.Location).toBe("/salle/nouveau-lieu?utm_source=google&campaign=test");
    expect(response.headers["Cache-Control"]).toContain("no-store");
    expect(response.end).toHaveBeenCalledWith();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/rest/v1/redirects");
    expect(url.searchParams.get("source_path")).toBe("eq./salle/ancien-lieu");
  });

  it("redirects blog aliases and removes the internal rewrite parameter", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ target_path: "/blog/article-nouveau" }] });
    const response = await request("/blog/article-original", "GET", "?path=/blog/article-original&utm_source=mail");
    expect(response.statusCode).toBe(301);
    expect(response.headers.Location).toBe("/blog/article-nouveau?utm_source=mail");
  });

  it.each(["https://evil.example/", "//evil.example/path", "/salle/ancien-lieu"])("refuses unsafe or self redirect %s", async (target) => {
    fetchMock.mockImplementation(async (url) => ({ ok: true, json: async () => new URL(url).pathname.endsWith("/redirects") ? [{ target_path: target }] : [] }));
    const response = await request("/salle/ancien-lieu");
    expect(response.statusCode).toBe(404);
    expect(response.headers.Location).toBeUndefined();
  });

  it("returns an uncached server error on a failed alias lookup", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const response = await request("/salle/ancien-lieu");
    expect(response.statusCode).toBe(500);
    expect(response.headers["Cache-Control"]).toContain("no-store");
  });

  it("keeps the urgent route ahead of the generic renderer and all birthday routes at 301", async () => {
    const actualFs = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    const { routes } = JSON.parse(await actualFs.readFile(new URL("../../vercel.json", import.meta.url), "utf8"));
    const urgentIndex = routes.findIndex((route) => route.src === "/salle/le-paris-clandestin/?");
    expect(routes[urgentIndex]).toMatchObject({ status: 301, headers: { Location: "/salle/le-myra" } });
    expect(urgentIndex).toBeLessThan(routes.findIndex((route) => route.dest?.startsWith("/api/seo-render")));
    const birthdays = routes.filter((route) => route.src.includes("anniversaire") && route.headers?.Location);
    expect(birthdays).toHaveLength(14);
    birthdays.forEach((route) => expect(route.status).toBe(301));
  });
});
