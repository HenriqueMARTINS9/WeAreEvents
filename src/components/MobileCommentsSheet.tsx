import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { Venue } from "@/types/venue";
import { getMobileComments, saveMobileComments, type MobileVenueComment } from "@/lib/mobile-comments";

interface MobileCommentsSheetProps {
  venue: Venue;
  onClose: () => void;
  onCommentsChange?: (count: number) => void;
}

const MobileCommentsSheet = ({ venue, onClose, onCommentsChange }: MobileCommentsSheetProps) => {
  const [comments, setComments] = useState<MobileVenueComment[]>(() => getMobileComments(venue.id));
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const orderedComments = useMemo(() => [...comments].reverse(), [comments]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;

    const nextComments = [
      ...comments,
      {
        id: crypto.randomUUID(),
        author: author.trim() || "Invité",
        message: message.trim(),
        createdAt: new Date().toISOString(),
      },
    ];

    setComments(nextComments);
    saveMobileComments(venue.id, nextComments);
    onCommentsChange?.(nextComments.length);
    setMessage("");
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center overflow-hidden">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <section className="relative flex h-[76dvh] w-full flex-col overflow-hidden rounded-t-lg bg-background animate-slide-up luxury-shadow">
        <header className="border-b border-border px-5 pb-3 pt-4">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-body font-semibold text-primary">{venue.title}</p>
              <h2 className="font-heading text-2xl font-semibold">Commentaires</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-muted" aria-label="Fermer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {orderedComments.length > 0 ? (
            <div className="space-y-4">
              {orderedComments.map((comment) => (
                <article key={comment.id} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-body font-semibold text-primary-foreground">
                    {comment.author.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-body font-semibold">{comment.author}</p>
                      <p className="text-[11px] font-body text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <p className="mt-1 break-words text-sm font-body leading-relaxed text-foreground/75">{comment.message}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-primary">
                <MessageCircle className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-2xl font-semibold">Aucun commentaire</h3>
              <p className="mt-2 max-w-xs text-sm font-body text-muted-foreground">
                Soyez le premier à laisser un commentaire court sur ce lieu.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur-md">
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Votre prénom"
            className="mb-2 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-body outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ajouter un commentaire..."
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm font-body outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              aria-label="Envoyer le commentaire"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default MobileCommentsSheet;
