import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVenuePageView } from "@/hooks/use-venue-page-view";

const mocks = vi.hoisted(() => ({ key: "initial", rpc: vi.fn() }));
vi.mock("react-router-dom", () => ({ useLocation: () => ({ key: mocks.key }) }));
vi.mock("@/lib/supabase", () => ({ supabase: { rpc: mocks.rpc } }));

beforeEach(() => {
  mocks.key = "initial";
  mocks.rpc.mockReset().mockResolvedValue({ error: null });
  Object.defineProperty(crypto, "randomUUID", { configurable: true, value: () => "00000000-0000-4000-8000-000000000001" });
});

describe("venue page displays", () => {
  it("records a loaded venue once despite StrictMode and unrelated rerenders", async () => {
    const { rerender } = renderHook(({ slug }) => useVenuePageView(slug), { initialProps: { slug: undefined as string | undefined }, wrapper: StrictMode });
    expect(mocks.rpc).not.toHaveBeenCalled();
    rerender({ slug: "le-myra" });
    rerender({ slug: "le-myra" });
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
    expect(mocks.rpc).toHaveBeenCalledWith("record_venue_page_view", { p_slug: "le-myra", p_view_id: expect.any(String) });
  });

  it("counts another navigation to the same venue and navigation to another venue", async () => {
    const { rerender } = renderHook(({ slug }) => useVenuePageView(slug), { initialProps: { slug: "le-myra" } });
    act(() => { mocks.key = "next-visit"; });
    rerender({ slug: "le-myra" });
    act(() => { mocks.key = "another-venue"; });
    rerender({ slug: "autre-lieu" });
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(3));
  });

  it("keeps a tracking failure from breaking the page", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.rpc.mockRejectedValueOnce(new Error("offline"));
    renderHook(() => useVenuePageView("le-myra"));
    await waitFor(() => expect(warn).toHaveBeenCalledOnce());
    warn.mockRestore();
  });
});
