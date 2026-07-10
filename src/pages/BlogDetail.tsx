import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import SiteFooter from "@/components/SiteFooter";
import VenueCodeSearch from "@/components/VenueCodeSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchBlogPostBySlug, fetchBlogPosts } from "@/lib/supabase-data";
import Seo, { siteUrl } from "@/components/Seo";
import { sanitizeBlogHtml } from "@/lib/blog-content";

const BlogContent = ({ content }: { content: string }) => (
  <div
    className="prose prose-neutral max-w-none font-body text-base leading-8 prose-headings:font-heading prose-headings:font-semibold prose-headings:leading-tight prose-h1:text-4xl prose-h2:mt-12 prose-h2:text-3xl prose-h3:mt-9 prose-h3:text-2xl prose-p:text-foreground/78 prose-a:font-medium prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-blockquote:border-primary prose-blockquote:text-foreground/70 prose-ul:list-disc prose-ol:list-decimal prose-li:text-foreground/78 prose-li:marker:text-primary prose-strong:text-foreground"
    dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(content) }}
  />
);

const BlogDetail = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchBlogPostBySlug(slug),
    enabled: Boolean(slug),
  });
  const { data: posts = [] } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const relatedPosts = useMemo(() => posts.filter((item) => item.slug !== slug).slice(0, 3), [posts, slug]);

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Seo title="Article introuvable - Wearevents" description="Cet article n'existe pas ou n'est plus publié." noindex />
        {isMobile ? <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground /> : <DesktopNav />}
        <main className="flex min-h-screen items-center justify-center px-6 pt-24">
          <div className="max-w-md text-center">
            <p className="mb-3 font-body text-sm font-semibold text-primary">Blog</p>
            <h1 className="font-heading text-4xl font-semibold">Article introuvable</h1>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
              Cet article n'existe pas ou n'est plus publié.
            </p>
            <button
              type="button"
              onClick={() => navigate("/blog")}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-body font-semibold text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au blog
            </button>
          </div>
        </main>
        {showCodeSearch && (
          <VenueCodeSearch
            onClose={() => setShowCodeSearch(false)}
            onVenueFound={() => setShowCodeSearch(false)}
          />
        )}
      </div>
    );
  }

  const articleContent = post.content?.trim() || post.excerpt;
  const seoTitle = post.seoTitle?.trim() || `${post.title} - Blog Wearevents`;
  const seoDescription = post.metaDescription?.trim() || post.excerpt;
  const secondaryKeywords = post.secondaryKeywords ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={`/blog/${post.slug}`}
        image={post.image || undefined}
        type="article"
        keywords={secondaryKeywords}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: seoDescription,
          keywords: secondaryKeywords.length ? secondaryKeywords.join(", ") : undefined,
          image: post.image,
          url: `${siteUrl}/blog/${post.slug}`,
          author: {
            "@type": "Organization",
            name: "Wearevents",
          },
          publisher: {
            "@type": "Organization",
            name: "Wearevents",
            logo: {
              "@type": "ImageObject",
              url: `${siteUrl}/favicon.png`,
            },
          },
          mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
        }}
      />
      {isMobile ? (
        <MobileHeader onCodeSearch={() => setShowCodeSearch(true)} withBackground />
      ) : (
        <DesktopNav />
      )}

      <main>
        <article>
          <section className="px-6 pb-12 pt-32">
            <div className="mx-auto max-w-7xl xl:px-2">
              <div className="mb-8 flex flex-wrap items-center gap-2 text-sm font-body text-muted-foreground">
                <Link to="/" className="hover:text-foreground">Accueil</Link>
                <span>/</span>
                <Link to="/blog" className="hover:text-foreground">Blog</Link>
                <span>/</span>
                <span className="text-foreground">{post.title}</span>
              </div>

              <div className="max-w-5xl">
                <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-body font-semibold uppercase tracking-[0.14em] text-primary">
                  <span>{post.category}</span>
                  <span className="h-1 w-1 rounded-full bg-primary/50" />
                  <span className="inline-flex items-center gap-1 normal-case tracking-normal text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <h1 className="font-heading text-5xl font-semibold leading-[0.98] xl:text-7xl">
                  {post.title}
                </h1>
                <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-muted-foreground xl:text-xl">
                  {post.excerpt}
                </p>
              </div>
            </div>
          </section>

          <section className="px-6 pb-16">
            <div className="mx-auto max-w-7xl xl:px-2">
              <img
                src={post.image}
                alt=""
                className="h-[360px] w-full rounded-2xl object-cover image-grade-luxe xl:h-[560px]"
              />
            </div>
          </section>

          <section className="px-6 pb-24">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 xl:grid-cols-[minmax(0,760px)_minmax(280px,1fr)] xl:px-2">
              <div className="rounded-2xl bg-card p-6 xl:p-10">
                <BlogContent content={articleContent} />
              </div>

              <aside className="xl:sticky xl:top-28 xl:self-start">
                <div className="rounded-2xl border border-border bg-secondary/40 p-6">
                  <p className="font-body text-sm font-semibold text-primary">Besoin d'un lieu ?</p>
                  <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight">
                    Trouvez une salle adaptée à votre événement.
                  </h2>
                  <p className="mt-4 text-sm font-body leading-relaxed text-muted-foreground">
                    Filtrez par ville, capacité, ambiance et budget pour comparer rapidement les bonnes options.
                  </p>
                  <Link
                    to="/recherche"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-body font-semibold text-primary-foreground transition-colors hover:bg-foreground"
                  >
                    Trouver ma salle
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        </article>

        {relatedPosts.length > 0 && (
          <section className="bg-secondary/35 px-6 py-20">
            <div className="mx-auto max-w-7xl xl:px-2">
              <div className="mb-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="mb-3 font-body text-sm font-semibold text-primary">À lire aussi</p>
                  <h2 className="font-heading text-4xl font-semibold leading-tight">Continuez à préparer votre événement.</h2>
                </div>
                <Link
                  to="/blog"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-body font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Tous les articles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    to={`/blog/${relatedPost.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-lg border border-border bg-card transition-transform hover:-translate-y-1"
                  >
                    <img src={relatedPost.image} alt="" className="h-52 w-full object-cover image-grade-luxe" />
                    <div className="px-5 pb-5 pt-4">
                      <div className="mb-2.5 flex items-center justify-between gap-3 text-xs font-body font-semibold text-muted-foreground">
                        <span className="text-primary">{relatedPost.category}</span>
                        <span>{relatedPost.readTime}</span>
                      </div>
                      <h3 className="font-heading text-2xl font-semibold leading-tight group-hover:text-primary">
                        {relatedPost.title}
                      </h3>
                      <p className="mt-2 text-sm font-body leading-relaxed text-muted-foreground">{relatedPost.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
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

export default BlogDetail;
