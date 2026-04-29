import { ArrowRight, Clock3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";
import SiteFooter from "@/components/SiteFooter";
import { fetchBlogPosts } from "@/lib/supabase-data";

const Blog = () => {
  const { data: posts = [] } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const heroPost = posts[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopNav />

      <main>
        <section className="px-6 pb-16 pt-32">
          <div className="mx-auto max-w-7xl xl:px-2">
            <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] xl:items-end">
              <div>
                <p className="mb-3 font-body text-sm font-semibold text-primary">Blog wearevents</p>
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
                <div className="flex flex-col justify-center p-8 xl:p-10">
                  <div className="mb-5 flex items-center gap-3 text-xs font-body font-semibold uppercase tracking-[0.14em] text-primary">
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
                  <p className="mt-4 font-body leading-relaxed text-muted-foreground">
                    {heroPost.excerpt}
                  </p>
                  <Link
                    to={`/blog#${heroPost.slug}`}
                    className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-body font-semibold transition-colors hover:border-primary/40 hover:text-primary"
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
              <article key={post.slug} id={post.slug} className="overflow-hidden rounded-lg border border-border bg-card">
                <img src={post.image} alt="" className="h-56 w-full object-cover image-grade-luxe" />
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-3 text-xs font-body font-semibold text-muted-foreground">
                    <span className="text-primary">{post.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl font-semibold leading-tight">{post.title}</h2>
                  <p className="mt-3 text-sm font-body leading-relaxed text-muted-foreground">{post.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Blog;
