import { ArrowRight, Clock3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchBlogPosts } from "@/lib/supabase-data";
import Seo, { siteUrl } from "@/components/Seo";

const Blog = () => {
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const { data: posts = [] } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const heroPost = posts[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Blog événementiel - Conseils pour choisir le bon lieu"
        description="Guides pratiques, checklists et conseils concrets pour choisir une salle, organiser un mariage, un anniversaire, un séminaire ou privatiser un lieu."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Blog Wearevents",
          description: "Conseils et guides pour trouver le bon lieu événementiel.",
          url: `${siteUrl}/blog`,
        }}
      />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <DesktopNav />
      )}

      <main>
        <section className="px-6 pb-16 pt-32">
          <div className="mx-auto max-w-7xl xl:px-2">
            <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] xl:items-end">
              <div>
                <p className="mb-3 font-body text-sm font-semibold text-primary">Blog Wearevents</p>
                <h1 className="font-heading text-5xl font-semibold leading-[0.98] xl:text-6xl">
                  Guides pratiques pour trouver le bon lieu pour vos événements.
                </h1>
              </div>
              <p className="max-w-2xl font-body text-lg leading-relaxed text-muted-foreground xl:justify-self-end">
                Conseils, checklists et idées pour choisir une salle, organiser un mariage, un anniversaire, un séminaire ou réussir la privatisation d'un lieu.
              </p>
            </div>

            {heroPost && (
            <article id={heroPost.slug} className="mt-14 overflow-hidden rounded-lg border border-border bg-card luxury-shadow">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                <img
                  src={heroPost.image}
                  alt=""
                  className="h-80 w-full object-cover image-grade-luxe xl:h-full"
                />
                <div className="flex flex-col justify-center px-7 py-6 xl:px-9 xl:py-8">
                  <div className="mb-3 flex items-center gap-3 text-xs font-body font-semibold uppercase tracking-[0.14em] text-primary">
                    <span>{heroPost.category}</span>
                    <span className="h-1 w-1 rounded-full bg-primary/50" />
                    <span className="inline-flex items-center gap-1 normal-case tracking-normal text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {heroPost.readTime}
                    </span>
                  </div>
                  <h2 className="font-heading text-3xl font-semibold leading-tight xl:text-4xl">
                    {heroPost.title}
                  </h2>
                  <p className="mt-3 font-body leading-relaxed text-muted-foreground">
                    {heroPost.excerpt}
                  </p>
                  <Link
                    to={`/blog/${heroPost.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-body font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    Lire l'article
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
            )}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3 xl:px-2">
            {posts.slice(1).map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-border bg-card transition-transform hover:-translate-y-1"
              >
                <img src={post.image} alt="" className="h-56 w-full object-cover image-grade-luxe" />
                <div className="px-5 pb-5 pt-4">
                  <div className="mb-2.5 flex items-center justify-between gap-3 text-xs font-body font-semibold text-muted-foreground">
                    <span className="text-primary">{post.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl font-semibold leading-tight group-hover:text-primary">{post.title}</h2>
                  <p className="mt-2 text-sm font-body leading-relaxed text-muted-foreground">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter variant="dark" />
      {showCodeSearch && (
        <VenueCodeSearch
          onClose={() => setShowCodeSearch(false)}
          onVenueFound={() => setShowCodeSearch(false)}
        />
      )}
    </div>
  );
};

export default Blog;
