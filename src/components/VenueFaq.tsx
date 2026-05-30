import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { Venue } from "@/types/venue";

interface VenueFaqProps {
  venue: Venue;
  compact?: boolean;
}

type VenueFaqItem = {
  question: string;
  answer: string;
  visible: boolean;
};

const normalizeValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const hasAnyTerm = (source: string, terms: string[]) =>
  terms.some((term) => source.includes(normalizeValue(term)));

const joinList = (items: string[]) => {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
};

const buildVenueFaqItems = (venue: Venue): VenueFaqItem[] => {
  const searchable = normalizeValue(
    [
      venue.title,
      venue.tagline,
      venue.description,
      venue.pricingText,
      venue.closingTime,
      ...venue.venueTypes,
      ...venue.eventCategories,
      ...venue.services,
      ...venue.ambianceTypes,
      ...venue.externalOptions,
      ...venue.privatizationTypes,
      ...venue.spaceTypes,
      ...venue.optionFeatures,
      ...venue.usefulInformation,
      ...venue.spaces.flatMap((space) => [space.name, space.description]),
    ].join(" "),
  );
  const hasMusic = hasAnyTerm(searchable, [
    "possibilite de mettre sa musique",
    "mettre sa musique",
    "dj",
    "musique",
    "systeme son",
    "table de mixage",
  ]);
  const hasFoodOrDrinks = hasAnyTerm(searchable, [
    "bar",
    "restaurant",
    "traiteur",
    "restauration",
    "boisson",
    "cocktail",
    "tapas",
    "planche",
    "cuisine",
    "diner",
    "dejeuner",
    "brunch",
  ]);
  const hasOutdoor = hasAnyTerm(searchable, [
    "terrasse",
    "rooftop",
    "exterieur",
    "jardin",
    "patio",
    "cour",
    "plein air",
    "piscine",
  ]);
  const hasDance = hasAnyTerm(searchable, [
    "possibilite de danser",
    "danser",
    "dancefloor",
    "piste de danse",
    "festif",
    "anime",
    "club",
    "discotheque",
    "soiree festive",
  ]);
  const eventCategories = venue.eventCategories.filter(Boolean);

  return [
    {
      question: "Peut-on privatiser ce lieu ?",
      answer: `Oui, le ${venue.title} peut être privatisé via Wearevents. Selon les conditions du lieu, la privatisation peut concerner l'ensemble de l'établissement ou un espace dédié.`,
      visible: venue.spaces.length > 0 || venue.privatizationTypes.length > 0,
    },
    {
      question: "Quels types d'événements peut-on organiser ici ?",
      answer: `Oui, le ${venue.title} accueille notamment ${joinList(eventCategories)}. Notre équipe vérifie avec vous que le format correspond bien à votre événement.`,
      visible: eventCategories.length > 0,
    },
    {
      question: "Le lieu propose-t-il des boissons ou de la restauration ?",
      answer: `Oui, le ${venue.title} propose des boissons et/ou une offre de restauration selon le format de votre événement. Les formules disponibles sont confirmées lors de votre demande.`,
      visible: hasFoodOrDrinks,
    },
    {
      question: "Peut-on mettre sa propre musique ?",
      answer: `Oui, le ${venue.title} permet de prévoir votre musique selon les conditions du lieu. Nous confirmons les modalités techniques avec l'établissement avant la réservation.`,
      visible: hasMusic,
    },
    {
      question: "Comment réserver ce lieu avec Wearevents ?",
      answer: `Oui, vous pouvez réserver le ${venue.title} avec Wearevents en envoyant une demande de disponibilité depuis cette fiche. Notre équipe revient ensuite vers vous pour qualifier votre besoin et avancer jusqu'à la confirmation.`,
      visible: true,
    },
    {
      question: "Les disponibilités sont-elles garanties ?",
      answer: `Oui, les disponibilités du ${venue.title} sont vérifiées par notre équipe après votre demande. La réservation est confirmée uniquement après validation de l'établissement.`,
      visible: true,
    },
    {
      question: "Le lieu dispose-t-il d'une terrasse, d'un rooftop ou d'un espace extérieur ?",
      answer: `Oui, le ${venue.title} dispose d'un espace extérieur, d'une terrasse ou d'un rooftop selon la configuration indiquée sur sa fiche. Nous confirmons les conditions d'accès lors de la demande.`,
      visible: hasOutdoor,
    },
    {
      question: "Le lieu permet-il de danser ou d'organiser une soirée festive ?",
      answer: `Oui, le ${venue.title} permet d'organiser une soirée festive ou de danser selon les conditions du lieu, les horaires et le format de privatisation retenu.`,
      visible: hasDance,
    },
  ].filter((item) => item.visible);
};

const VenueFaq = ({ venue, compact = false }: VenueFaqProps) => {
  const [openIndex, setOpenIndex] = useState(0);
  const items = buildVenueFaqItems(venue);

  if (!items.length) return null;

  return (
    <section
      id="faq"
      className={`scroll-mt-28 rounded-lg border border-border bg-background ${compact ? "p-4" : "p-6"}`}
    >
      <div className={compact ? "mb-4" : "mb-5 flex items-start justify-between gap-6"}>
        <div>
          <p className="flex items-center gap-2 font-body text-sm font-semibold text-primary">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </p>
          <h2 className={`mt-2 font-heading font-semibold ${compact ? "text-2xl" : "text-3xl"}`}>
            Questions fréquentes sur {venue.title}
          </h2>
        </div>
        {!compact && (
          <p className="max-w-sm font-body text-sm leading-relaxed text-muted-foreground">
            Les réponses utiles avant d'envoyer votre demande de disponibilité.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <article key={item.question} className="overflow-hidden rounded-lg border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-body text-sm font-semibold leading-snug md:text-base">{item.question}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="border-t border-border px-4 py-4 font-body text-sm leading-relaxed text-foreground/75">
                    {item.answer}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default VenueFaq;
