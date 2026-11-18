import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

function currentParisMonth() {
  const parts = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}

export default function VenueViews() {
  const [month, setMonth] = useState(currentParisMonth);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin-venue-views", month],
    queryFn: async () => {
      if (!supabase) throw new Error("Connexion indisponible");
      const { data, error } = await supabase.rpc("venue_monthly_page_views", { p_month: `${month}-01` });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Vues des fiches</h2>
          <p className="mt-2 text-sm text-muted-foreground">Affichages des pages salle, par mois (heure de Paris). Les rechargements et les nouvelles visites sont comptés.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold">Mois
            <input aria-label="Mois des statistiques" type="month" value={month} onChange={(event) => {
              if (/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)) setMonth(event.target.value);
            }} className="mt-1 block rounded-lg border border-border bg-card px-3 py-2" />
          </label>
          <button type="button" onClick={() => void refetch()} disabled={isFetching} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">Actualiser</button>
        </div>
      </div>
      {isLoading ? <p role="status">Chargement des statistiques…</p> : isError ? (
        <p role="alert" className="rounded-lg border border-border bg-card p-4">Impossible de charger les statistiques. Réessayez avec le bouton Actualiser.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <caption className="p-4 text-left font-semibold">{(data ?? []).reduce((total, row) => total + Number(row.views), 0).toLocaleString("fr-FR")} vues au total pour le mois sélectionné</caption>
            <thead className="border-y border-border bg-secondary"><tr><th scope="col" className="p-4">Lieu</th><th scope="col" className="p-4">Slug actuel</th><th scope="col" className="p-4 text-right">Vues</th></tr></thead>
            <tbody>
              {(data ?? []).map((row) => <tr key={row.venue_id} className="border-t border-border"><th scope="row" className="p-4">{row.title}</th><td className="p-4">{row.slug}</td><td className="p-4 text-right tabular-nums">{Number(row.views).toLocaleString("fr-FR")}</td></tr>)}
              {!data?.length && <tr><td colSpan={3} className="p-4 text-muted-foreground">Aucun lieu disponible.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm text-muted-foreground">Le suivi commence à son activation. Les vues restent associées au lieu après un changement de slug. Ce compteur mesure les affichages, pas les visiteurs uniques.</p>
    </div>
  );
}
