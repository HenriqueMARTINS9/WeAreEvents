import { useState } from "react";
import { ArrowRight, ChevronDown, HelpCircle, MessageCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { faqItems } from "@/data/faq";

interface FaqSectionProps {
  compact?: boolean;
}

const FaqSection = ({ compact = false }: FaqSectionProps) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-background px-6 py-20 text-foreground md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] xl:gap-14 xl:px-2">
        <div className="xl:sticky xl:top-28 xl:self-start">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
            <HelpCircle className="h-6 w-6" />
          </div>
          <p className="mb-3 font-body text-sm font-semibold text-primary">Questions fréquentes</p>
          <h2 className="font-heading text-4xl font-semibold leading-[1.02] md:text-5xl">
            Tout savoir avant de réserver.
          </h2>
          <p className="mt-5 max-w-xl font-body leading-relaxed text-muted-foreground">
            Fonctionnement, gratuité, types de lieux, délais et formats de privatisation : les réponses aux questions les plus courantes.
          </p>

          {!compact && (
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { icon: <Search className="h-4 w-4" />, label: "Demande simple", text: "Date, invités et besoin." },
                { icon: <MessageCircle className="h-4 w-4" />, label: "Accompagnement", text: "Notre équipe qualifie votre projet." },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 font-body text-sm font-semibold">
                    <span className="text-primary">{item.icon}</span>
                    {item.label}
                  </div>
                  <p className="mt-2 font-body text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <article key={item.question} className="overflow-hidden rounded-lg border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-5 px-5 py-4 text-left md:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="flex min-w-0 items-start gap-4">
                    <span className="mt-0.5 font-heading text-lg text-primary md:text-xl">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-body text-base font-semibold leading-snug md:text-lg">
                      {item.question}
                    </span>
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-border px-5 py-5 md:px-6">
                      <div className="space-y-3 pl-0 md:pl-12">
                        {item.answer.map((paragraph) => (
                          <p key={paragraph} className="font-body text-sm leading-relaxed text-foreground/75 md:text-base">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!compact && (
            <Link
              to="/recherche"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 font-body text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Trouver ma salle
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
