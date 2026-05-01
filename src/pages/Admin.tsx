import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Building2,
  FileText,
  FolderInput,
  Image,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { blogPosts } from "@/data/blog";
import { mockVenues } from "@/data/venues";
import { AMBIANCE_TYPES, EVENT_TYPES, EXTERNAL_OPTIONS, PRICE_TIERS, SERVICES } from "@/types/venue";
import { isSupabaseConfigured, supabase, type BlogPostInsert, type VenueInsert } from "@/lib/supabase";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toList = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const defaultVenue = mockVenues[0];
const defaultBlogPost = blogPosts[0];
const googleDrivePublicApi = import.meta.env.VITE_GOOGLE_DRIVE_PUBLIC_API;
const imageBucket = "wearevents-images";

const createEmptyVenueForm = () => ({
  title: "",
  slug: "",
  tagline: "",
  description: "",
  city: "",
  address: "",
  lat: "",
  lng: "",
  venueCode: "",
  minCapacity: "",
  maxCapacity: "",
  eventCategories: EVENT_TYPES.slice(0, 2).join(", "),
  services: SERVICES.slice(0, 4).join(", "),
  spaces: "Salle principale | 120 | Espace principal modulable",
  accessDetails: "",
  usefulInformation: "",
  pricingText: "",
  coverImage: defaultVenue.coverImage,
  gallery: defaultVenue.gallery.join("\n"),
  videoUrl: "",
  videoStartSeconds: "0",
  videoEndSeconds: "",
  tiktokUrl: "",
  googleReviewUrl: "",
  priceTier: "€€",
  closingTime: "",
  ambianceTypes: AMBIANCE_TYPES.slice(0, 2).join(", "),
  externalOptions: EXTERNAL_OPTIONS.slice(0, 1).join(", "),
  metroAccess: "",
  featured: true,
  active: true,
  contactEmail: "",
  rating: "0",
  reviewCount: "0",
});

const createEmptyBlogForm = () => ({
  title: "",
  slug: "",
  category: defaultBlogPost.category,
  excerpt: "",
  content: "",
  readTime: defaultBlogPost.readTime,
  image: defaultBlogPost.image,
  published: true,
});

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState<"dashboard" | "venues" | "blogs">("dashboard");
  const [modal, setModal] = useState<"venue" | "blog" | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [message, setMessage] = useState("");
  const [venueDriveFolderUrl, setVenueDriveFolderUrl] = useState("");
  const [blogDriveFolderUrl, setBlogDriveFolderUrl] = useState("");
  const [adminVenues, setAdminVenues] = useState<any[]>([]);
  const [adminBlogPosts, setAdminBlogPosts] = useState<any[]>([]);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [venueForm, setVenueForm] = useState(createEmptyVenueForm);
  const [blogForm, setBlogForm] = useState(createEmptyBlogForm);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const loadAdminRecords = async () => {
    if (!supabase || !session) return;

    const [venuesResult, blogResult] = await Promise.all([
      supabase.from("venues").select("*").order("created_at", { ascending: false }),
      supabase.from("blog_posts").select("*").order("created_at", { ascending: false }),
    ]);

    if (!venuesResult.error) setAdminVenues(venuesResult.data ?? []);
    if (!blogResult.error) setAdminBlogPosts(blogResult.data ?? []);
  };

  useEffect(() => {
    loadAdminRecords();
  }, [session]);

  const canSubmit = useMemo(() => Boolean(supabase && session), [session]);
  const activeVenues = adminVenues.filter((venue) => venue.active).length;
  const featuredVenues = adminVenues.filter((venue) => venue.featured).length;
  const publishedPosts = adminBlogPosts.filter((post) => post.published).length;

  const uploadImages = async (files: FileList | File[], folder: string) => {
    if (!supabase) return [];
    const urls: string[] = [];

    for (const file of Array.from(files).filter((item) => item.type.startsWith("image/"))) {
      const extension = file.name.split(".").pop() || "jpg";
      const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
      const path = `${folder}/${Date.now()}-${safeName}.${extension}`;
      const { error } = await supabase.storage.from(imageBucket).upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      urls.push(supabase.storage.from(imageBucket).getPublicUrl(path).data.publicUrl);
    }

    return urls;
  };

  const applyVenueImageUrls = (urls: string[]) => {
    if (!urls.length) return;
    const [coverImage, ...galleryImages] = urls;
    setVenueForm((current) => ({
      ...current,
      coverImage,
      gallery: [...galleryImages, ...toList(current.gallery)].join("\n"),
    }));
  };

  const applyBlogImageUrls = (urls: string[]) => {
    if (!urls.length) return;
    setBlogForm((current) => ({ ...current, image: urls[0] }));
  };

  const handleVenueImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    setMessage("");

    try {
      const folder = `venues/${venueForm.slug || slugify(venueForm.title) || "nouvelle-salle"}`;
      applyVenueImageUrls(await uploadImages(files, folder));
      setMessage("Images importées : première image en couverture, autres en galerie.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'importer les images.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleBlogImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    setMessage("");

    try {
      const folder = `blog/${blogForm.slug || slugify(blogForm.title) || "nouvel-article"}`;
      applyBlogImageUrls(await uploadImages(files, folder));
      setMessage("Image de l'article importée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'importer l'image.");
    } finally {
      setUploadingImages(false);
    }
  };

  const importDriveFolder = async (folderUrl: string) => {
    const folderId = getGoogleDriveFolderId(folderUrl);
    if (!folderId) throw new Error("Lien Google Drive invalide.");
    if (!googleDrivePublicApi) throw new Error("Ajoute VITE_GOOGLE_DRIVE_PUBLIC_API dans .env.local pour importer un dossier Google Drive.");

    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id,name,mimeType)",
      orderBy: "name",
      key: googleDrivePublicApi,
    });
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    const json = await response.json();
    if (!response.ok) throw new Error(json.error?.message || "Impossible de lire ce dossier Google Drive.");

    return (json.files ?? []).map((file: { id: string }) => `https://drive.google.com/uc?export=view&id=${file.id}`);
  };

  const handleVenueDriveImport = async () => {
    setUploadingImages(true);
    setMessage("");

    try {
      applyVenueImageUrls(await importDriveFolder(venueDriveFolderUrl));
      setMessage("Images Google Drive importées.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'importer le dossier Google Drive.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleBlogDriveImport = async () => {
    setUploadingImages(true);
    setMessage("");

    try {
      applyBlogImageUrls(await importDriveFolder(blogDriveFolderUrl));
      setMessage("Image Google Drive importée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'importer le dossier Google Drive.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setMessage("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    setMessage(error ? error.message : "Connexion réussie.");
  };

  const closeModal = () => {
    setModal(null);
    setEditingVenueId(null);
    setEditingBlogId(null);
    setVenueDriveFolderUrl("");
    setBlogDriveFolderUrl("");
  };

  const openCreateVenue = () => {
    setVenueForm(createEmptyVenueForm());
    setEditingVenueId(null);
    setModal("venue");
  };

  const openCreateBlog = () => {
    setBlogForm(createEmptyBlogForm());
    setEditingBlogId(null);
    setModal("blog");
  };

  const handleVenueSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !canSubmit) return;
    setSaving(true);
    setMessage("");

    const spaces = venueForm.spaces
      .split("\n")
      .map((line, index) => {
        const [name = "", capacity = "0", description = ""] = line.split("|").map((part) => part.trim());
        return { id: slugify(name) || `space-${index + 1}`, name, capacity: toNumber(capacity), description };
      })
      .filter((space) => space.name);

    const payload: VenueInsert = {
      title: venueForm.title,
      slug: venueForm.slug || slugify(venueForm.title),
      tagline: venueForm.tagline,
      description: venueForm.description,
      city: venueForm.city,
      address: venueForm.address,
      location: { lat: toNumber(venueForm.lat), lng: toNumber(venueForm.lng) },
      venue_code: venueForm.venueCode.replace(/\D/g, "").slice(0, 4),
      min_capacity: toNumber(venueForm.minCapacity),
      max_capacity: toNumber(venueForm.maxCapacity),
      event_categories: toList(venueForm.eventCategories),
      services: toList(venueForm.services),
      spaces,
      access_details: toList(venueForm.accessDetails),
      useful_information: toList(venueForm.usefulInformation),
      pricing_text: venueForm.pricingText,
      cover_image: venueForm.coverImage,
      gallery: toList(venueForm.gallery),
      video_url: venueForm.videoUrl || null,
      video_start_seconds: toNumber(venueForm.videoStartSeconds),
      video_end_seconds: venueForm.videoEndSeconds ? toNumber(venueForm.videoEndSeconds) : null,
      tiktok_url: venueForm.tiktokUrl || null,
      google_review_url: venueForm.googleReviewUrl,
      price_tier: venueForm.priceTier as "€" | "€€" | "€€€",
      closing_time: venueForm.closingTime,
      ambiance_types: toList(venueForm.ambianceTypes),
      external_options: toList(venueForm.externalOptions),
      metro_access: venueForm.metroAccess || null,
      featured: venueForm.featured,
      active: venueForm.active,
      contact_email: venueForm.contactEmail,
      rating: toNumber(venueForm.rating),
      review_count: toNumber(venueForm.reviewCount),
    };

    const { error } = editingVenueId
      ? await supabase.from("venues").update(payload).eq("id", editingVenueId)
      : await supabase.from("venues").insert(payload);

    setSaving(false);
    setMessage(error ? error.message : editingVenueId ? "Salle mise à jour." : "Salle ajoutée.");
    if (!error) {
      closeModal();
      loadAdminRecords();
      setView("venues");
    }
  };

  const handleBlogSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !canSubmit) return;
    setSaving(true);
    setMessage("");

    const payload: BlogPostInsert = {
      title: blogForm.title,
      slug: blogForm.slug || slugify(blogForm.title),
      category: blogForm.category,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      read_time: blogForm.readTime,
      image: blogForm.image,
      published: blogForm.published,
      published_at: blogForm.published ? new Date().toISOString() : null,
    };

    const { error } = editingBlogId
      ? await supabase.from("blog_posts").update(payload).eq("id", editingBlogId)
      : await supabase.from("blog_posts").insert(payload);

    setSaving(false);
    setMessage(error ? error.message : editingBlogId ? "Article mis à jour." : "Article ajouté.");
    if (!error) {
      closeModal();
      loadAdminRecords();
      setView("blogs");
    }
  };

  const editVenue = (venue: any) => {
    setEditingVenueId(venue.id);
    setVenueForm({
      title: venue.title ?? "",
      slug: venue.slug ?? "",
      tagline: venue.tagline ?? "",
      description: venue.description ?? "",
      city: venue.city ?? "",
      address: venue.address ?? "",
      lat: String(venue.location?.lat ?? ""),
      lng: String(venue.location?.lng ?? ""),
      venueCode: venue.venue_code ?? "",
      minCapacity: String(venue.min_capacity ?? ""),
      maxCapacity: String(venue.max_capacity ?? ""),
      eventCategories: (venue.event_categories ?? []).join(", "),
      services: (venue.services ?? []).join(", "),
      spaces: (venue.spaces ?? []).map((space: any) => `${space.name} | ${space.capacity} | ${space.description}`).join("\n"),
      accessDetails: (venue.access_details ?? []).join("\n"),
      usefulInformation: (venue.useful_information ?? []).join("\n"),
      pricingText: venue.pricing_text ?? "",
      coverImage: venue.cover_image ?? "",
      gallery: (venue.gallery ?? []).join("\n"),
      videoUrl: venue.video_url ?? "",
      videoStartSeconds: String(venue.video_start_seconds ?? 0),
      videoEndSeconds: venue.video_end_seconds ? String(venue.video_end_seconds) : "",
      tiktokUrl: venue.tiktok_url ?? "",
      googleReviewUrl: venue.google_review_url ?? "",
      priceTier: venue.price_tier ?? "€€",
      closingTime: venue.closing_time ?? "",
      ambianceTypes: (venue.ambiance_types ?? []).join(", "),
      externalOptions: (venue.external_options ?? []).join(", "),
      metroAccess: venue.metro_access ?? "",
      featured: Boolean(venue.featured),
      active: Boolean(venue.active),
      contactEmail: venue.contact_email ?? "",
      rating: String(venue.rating ?? 0),
      reviewCount: String(venue.review_count ?? 0),
    });
    setModal("venue");
  };

  const editBlogPost = (post: any) => {
    setEditingBlogId(post.id);
    setBlogForm({
      title: post.title ?? "",
      slug: post.slug ?? "",
      category: post.category ?? "",
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      readTime: post.read_time ?? "",
      image: post.image ?? "",
      published: Boolean(post.published),
    });
    setModal("blog");
  };

  const deleteVenue = async (venueId: string) => {
    if (!supabase || !window.confirm("Supprimer cette salle ?")) return;
    const { error } = await supabase.from("venues").delete().eq("id", venueId);
    setMessage(error ? error.message : "Salle supprimée.");
    if (!error) loadAdminRecords();
  };

  const deleteBlogPost = async (postId: string) => {
    if (!supabase || !window.confirm("Supprimer cet article ?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
    setMessage(error ? error.message : "Article supprimé.");
    if (!error) loadAdminRecords();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="font-body text-sm font-semibold text-primary">wearevents</p>
            <h1 className="font-heading text-3xl font-semibold">Back office</h1>
          </div>
          {session && supabase && (
            <button type="button" onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-body font-semibold transition-colors hover:border-primary/40">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!isSupabaseConfigured && <SupabaseSetupNotice />}
        {isSupabaseConfigured && !session && (
          <LoginForm
            email={email}
            password={password}
            loading={authLoading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
          />
        )}

        {session && (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[240px_minmax(0,1fr)]">
            <AdminSidebar view={view} onViewChange={setView} onCreateVenue={openCreateVenue} onCreateBlog={openCreateBlog} />
            <section className="min-w-0">
              {view === "dashboard" && (
                <DashboardView
                  venuesCount={adminVenues.length}
                  activeVenues={activeVenues}
                  featuredVenues={featuredVenues}
                  postsCount={adminBlogPosts.length}
                  publishedPosts={publishedPosts}
                  recentVenues={adminVenues.slice(0, 4)}
                  recentPosts={adminBlogPosts.slice(0, 4)}
                  onCreateVenue={openCreateVenue}
                  onCreateBlog={openCreateBlog}
                  onOpenVenues={() => setView("venues")}
                  onOpenBlogs={() => setView("blogs")}
                />
              )}
              {view === "venues" && (
                <VenuesView venues={adminVenues} onCreate={openCreateVenue} onEdit={editVenue} onDelete={(item) => deleteVenue(item.id)} />
              )}
              {view === "blogs" && (
                <BlogsView posts={adminBlogPosts} onCreate={openCreateBlog} onEdit={editBlogPost} onDelete={(item) => deleteBlogPost(item.id)} />
              )}
              {message && <div className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-sm font-body text-muted-foreground">{message}</div>}
            </section>
          </div>
        )}
      </main>

      {modal === "venue" && (
        <AdminModal title={editingVenueId ? "Modifier la salle" : "Ajouter une salle"} onClose={closeModal}>
          <VenueForm
            form={venueForm}
            setForm={setVenueForm}
            saving={saving}
            editing={Boolean(editingVenueId)}
            venueDriveFolderUrl={venueDriveFolderUrl}
            setVenueDriveFolderUrl={setVenueDriveFolderUrl}
            onSubmit={handleVenueSubmit}
            onFilesSelected={handleVenueImageUpload}
            onDriveImport={handleVenueDriveImport}
            uploadingImages={uploadingImages}
          />
        </AdminModal>
      )}
      {modal === "blog" && (
        <AdminModal title={editingBlogId ? "Modifier l'article" : "Ajouter un article"} onClose={closeModal}>
          <BlogForm
            form={blogForm}
            setForm={setBlogForm}
            saving={saving}
            editing={Boolean(editingBlogId)}
            blogDriveFolderUrl={blogDriveFolderUrl}
            setBlogDriveFolderUrl={setBlogDriveFolderUrl}
            onSubmit={handleBlogSubmit}
            onFilesSelected={handleBlogImageUpload}
            onDriveImport={handleBlogDriveImport}
            uploadingImages={uploadingImages}
          />
        </AdminModal>
      )}
    </div>
  );
};

const SupabaseSetupNotice = () => (
  <section className="rounded-lg border border-border bg-card p-6">
    <h2 className="font-heading text-2xl font-semibold">Supabase n'est pas encore configuré</h2>
    <p className="mt-3 max-w-3xl text-sm font-body leading-relaxed text-muted-foreground">
      Crée un projet Supabase, exécute le SQL dans <span className="font-semibold text-foreground">supabase/schema.sql</span>,
      puis ajoute <span className="font-semibold text-foreground">VITE_SUPABASE_URL</span> et{" "}
      <span className="font-semibold text-foreground">VITE_SUPABASE_PUBLISHABLE</span> dans un fichier .env local.
    </p>
  </section>
);

const LoginForm = ({ email, password, loading, onEmailChange, onPasswordChange, onSubmit }: any) => (
  <form onSubmit={onSubmit} className="max-w-md rounded-lg border border-border bg-card p-6 luxury-shadow">
    <h2 className="font-heading text-2xl font-semibold">Connexion admin</h2>
    <p className="mt-2 text-sm font-body text-muted-foreground">Utilise un utilisateur créé dans Supabase Auth.</p>
    <div className="mt-6 space-y-4">
      <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="Email" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary" />
      <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Mot de passe" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary" />
      <button type="submit" disabled={loading} className="brand-primary-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-body font-semibold text-primary-foreground disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Se connecter
      </button>
    </div>
  </form>
);

const AdminSidebar = ({ view, onViewChange, onCreateVenue, onCreateBlog }: any) => (
  <aside className="h-fit rounded-lg border border-border bg-card p-3 xl:sticky xl:top-6">
    {[
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "venues", label: "Salles", icon: <Building2 className="h-4 w-4" /> },
      { id: "blogs", label: "Blogs", icon: <FileText className="h-4 w-4" /> },
    ].map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => onViewChange(item.id)}
        className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-body font-semibold transition-colors ${
          view === item.id ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        {item.icon}
        {item.label}
      </button>
    ))}
    <div className="mt-3 border-t border-border pt-3">
      <button type="button" onClick={onCreateVenue} className="mb-2 flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-body font-semibold hover:border-primary/40">
        <Plus className="h-4 w-4" />
        Ajouter une salle
      </button>
      <button type="button" onClick={onCreateBlog} className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-body font-semibold hover:border-primary/40">
        <Plus className="h-4 w-4" />
        Ajouter un blog
      </button>
    </div>
  </aside>
);

const DashboardView = ({ venuesCount, activeVenues, featuredVenues, postsCount, publishedPosts, recentVenues, recentPosts, onCreateVenue, onCreateBlog, onOpenVenues, onOpenBlogs }: any) => (
  <div>
    <div className="mb-8">
      <p className="font-body text-sm font-semibold text-primary">Vue rapide</p>
      <h2 className="font-heading text-4xl font-semibold">Dashboard</h2>
      <p className="mt-2 text-sm font-body text-muted-foreground">Gérez les salles, les contenus blog et les informations visibles sur le site.</p>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <MetricCard label="Salles" value={venuesCount} detail={`${activeVenues} actives`} />
      <MetricCard label="À forte demande" value={featuredVenues} detail="mises en avant" />
      <MetricCard label="Articles" value={postsCount} detail={`${publishedPosts} publiés`} />
      <MetricCard label="Actions" value="4" detail="créer, modifier, publier, supprimer" />
    </div>
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <QuickPanel title="Salles récentes" items={recentVenues} empty="Aucune salle" getTitle={(item: any) => item.title} getMeta={(item: any) => `${item.venue_code} · ${item.city} · ${item.active ? "active" : "inactive"}`} onOpen={onOpenVenues} actionLabel="Voir les salles" />
      <QuickPanel title="Blogs récents" items={recentPosts} empty="Aucun article" getTitle={(item: any) => item.title} getMeta={(item: any) => `${item.category} · ${item.published ? "publié" : "brouillon"}`} onOpen={onOpenBlogs} actionLabel="Voir les blogs" />
    </div>
    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <ActionCard title="Ajouter une salle" description="Créer une fiche complète avec galerie, infos pratiques, filtres et vidéo." onClick={onCreateVenue} />
      <ActionCard title="Ajouter un blog" description="Publier un guide ou une checklist visible sur la page Blog et l'accueil." onClick={onCreateBlog} />
    </div>
  </div>
);

const VenuesView = ({ venues, onCreate, onEdit, onDelete }: any) => (
  <AdminTable
    title="Salles"
    description="Toutes les salles disponibles dans le back office."
    createLabel="Ajouter une salle"
    onCreate={onCreate}
    columns={["Salle", "Ville", "Code", "Capacité", "Prix", "Fermeture", "Statut"]}
    rows={venues}
    renderRow={(venue: any) => [
      <ItemTitle image={venue.cover_image} title={venue.title} subtitle={venue.slug} />,
      venue.city || "-",
      venue.venue_code || "-",
      `${venue.min_capacity ?? 0}-${venue.max_capacity ?? 0}`,
      venue.price_tier || "-",
      venue.closing_time || "-",
      <StatusBadge active={venue.active} featured={venue.featured} />,
    ]}
    onEdit={onEdit}
    onDelete={onDelete}
  />
);

const BlogsView = ({ posts, onCreate, onEdit, onDelete }: any) => (
  <AdminTable
    title="Blogs"
    description="Tous les articles affichables sur le site."
    createLabel="Ajouter un blog"
    onCreate={onCreate}
    columns={["Article", "Catégorie", "Lecture", "Publication", "Créé le"]}
    rows={posts}
    renderRow={(post: any) => [
      <ItemTitle image={post.image} title={post.title} subtitle={post.slug} />,
      post.category || "-",
      post.read_time || "-",
      post.published ? "Publié" : "Brouillon",
      post.created_at ? new Date(post.created_at).toLocaleDateString("fr-FR") : "-",
    ]}
    onEdit={onEdit}
    onDelete={onDelete}
  />
);

const AdminTable = ({ title, description, createLabel, onCreate, columns, rows, renderRow, onEdit, onDelete }: any) => (
  <section>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-heading text-4xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm font-body text-muted-foreground">{description}</p>
      </div>
      <button type="button" onClick={onCreate} className="brand-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-body font-semibold text-primary-foreground">
        <Plus className="h-4 w-4" />
        {createLabel}
      </button>
    </div>
    <div className="overflow-hidden rounded-lg border border-border bg-card luxury-shadow">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b border-border bg-secondary/70">
            <tr>
              {columns.map((column: string) => (
                <th key={column} className="px-4 py-3 text-xs font-body font-semibold uppercase text-muted-foreground">{column}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-body font-semibold uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm font-body text-muted-foreground">Aucun élément pour le moment.</td></tr>
            ) : (
              rows.map((row: any) => (
                <tr key={row.id} className="align-middle">
                  {renderRow(row).map((cell: any, index: number) => (
                    <td key={index} className="px-4 py-4 text-sm font-body text-foreground/80">{cell}</td>
                  ))}
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(row)} className="rounded-lg border border-border p-2 transition-colors hover:border-primary/40" aria-label="Modifier">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(row)} className="rounded-lg border border-destructive/30 p-2 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground" aria-label="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

const AdminModal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
    <section className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-background luxury-shadow">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-lg border border-border p-2 hover:border-primary/40" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="overflow-y-auto p-5">{children}</div>
    </section>
  </div>
);

const VenueForm = ({ form, setForm, saving, editing, venueDriveFolderUrl, setVenueDriveFolderUrl, onSubmit, onFilesSelected, onDriveImport, uploadingImages }: any) => (
  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
    <AdminInput label="Nom de la salle" value={form.title} onChange={(value) => setForm({ ...form, title: value, slug: form.slug || slugify(value) })} required />
    <AdminInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} required />
    <AdminInput label="Code lieu (4 chiffres)" value={form.venueCode} onChange={(value) => setForm({ ...form, venueCode: value.replace(/\D/g, "").slice(0, 4) })} required />
    <AdminInput label="Email contact" value={form.contactEmail} onChange={(value) => setForm({ ...form, contactEmail: value })} required />
    <AdminInput label="Ville" value={form.city} onChange={(value) => setForm({ ...form, city: value })} required />
    <AdminInput label="Adresse" value={form.address} onChange={(value) => setForm({ ...form, address: value })} required />
    <AdminInput label="Latitude" value={form.lat} onChange={(value) => setForm({ ...form, lat: value })} />
    <AdminInput label="Longitude" value={form.lng} onChange={(value) => setForm({ ...form, lng: value })} />
    <AdminInput label="Capacité minimum" value={form.minCapacity} onChange={(value) => setForm({ ...form, minCapacity: value })} />
    <AdminInput label="Capacité maximum" value={form.maxCapacity} onChange={(value) => setForm({ ...form, maxCapacity: value })} />
    <AdminInput label="Prix indicatif" value={form.pricingText} onChange={(value) => setForm({ ...form, pricingText: value })} />
    <AdminSelect label="Symbole prix" value={form.priceTier} onChange={(value) => setForm({ ...form, priceTier: value })} options={PRICE_TIERS} />
    <AdminInput label="Heure de fermeture" value={form.closingTime} onChange={(value) => setForm({ ...form, closingTime: value })} placeholder="Ex: 02:00" />
    <AdminInput label="Accès métro" value={form.metroAccess} onChange={(value) => setForm({ ...form, metroAccess: value })} placeholder="Ex: George V, ligne 1" />
    <AdminImageTools title="Images de la salle" description="Upload direct ou dossier Google Drive public. La première image devient la couverture." driveFolderUrl={venueDriveFolderUrl} onDriveFolderUrlChange={setVenueDriveFolderUrl} onDriveImport={onDriveImport} onFilesSelected={onFilesSelected} uploading={uploadingImages} />
    <AdminInput label="Image principale" value={form.coverImage} onChange={(value) => setForm({ ...form, coverImage: value })} required />
    <AdminTextarea label="Accroche" value={form.tagline} onChange={(value) => setForm({ ...form, tagline: value })} />
    <AdminTextarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
    <AdminTextarea label="Catégories d'événements" hint="Sépare par virgule ou ligne." value={form.eventCategories} onChange={(value) => setForm({ ...form, eventCategories: value })} />
    <AdminTextarea label="Services" hint="Sépare par virgule ou ligne." value={form.services} onChange={(value) => setForm({ ...form, services: value })} />
    <AdminTextarea label="Types d'ambiance" hint={`Ex: ${AMBIANCE_TYPES.join(", ")}`} value={form.ambianceTypes} onChange={(value) => setForm({ ...form, ambianceTypes: value })} />
    <AdminTextarea label="Personnalisation externe" hint={`Ex: ${EXTERNAL_OPTIONS.join(", ")}`} value={form.externalOptions} onChange={(value) => setForm({ ...form, externalOptions: value })} />
    <AdminTextarea label="Espaces" hint="Une ligne par espace : Nom | Capacité | Description" value={form.spaces} onChange={(value) => setForm({ ...form, spaces: value })} />
    <AdminTextarea label="Galerie" hint="Une URL par ligne." value={form.gallery} onChange={(value) => setForm({ ...form, gallery: value })} />
    <AdminTextarea label="Accès" value={form.accessDetails} onChange={(value) => setForm({ ...form, accessDetails: value })} />
    <AdminTextarea label="Informations utiles" value={form.usefulInformation} onChange={(value) => setForm({ ...form, usefulInformation: value })} />
    <AdminInput label="URL vidéo" value={form.videoUrl} onChange={(value) => setForm({ ...form, videoUrl: value })} />
    <AdminInput label="Début vidéo en secondes" value={form.videoStartSeconds} onChange={(value) => setForm({ ...form, videoStartSeconds: value })} />
    <AdminInput label="Fin vidéo en secondes" value={form.videoEndSeconds} onChange={(value) => setForm({ ...form, videoEndSeconds: value })} />
    <AdminInput label="URL TikTok" value={form.tiktokUrl} onChange={(value) => setForm({ ...form, tiktokUrl: value })} />
    <AdminInput label="URL avis Google" value={form.googleReviewUrl} onChange={(value) => setForm({ ...form, googleReviewUrl: value })} />
    <div className="flex items-center gap-6 rounded-lg border border-border bg-card p-4">
      <AdminCheckbox label="Mise en avant" checked={form.featured} onChange={(value) => setForm({ ...form, featured: value })} />
      <AdminCheckbox label="Active" checked={form.active} onChange={(value) => setForm({ ...form, active: value })} />
    </div>
    <SubmitBar saving={saving} label={editing ? "Mettre à jour la salle" : "Enregistrer la salle"} />
  </form>
);

const BlogForm = ({ form, setForm, saving, editing, blogDriveFolderUrl, setBlogDriveFolderUrl, onSubmit, onFilesSelected, onDriveImport, uploadingImages }: any) => (
  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
    <AdminInput label="Titre" value={form.title} onChange={(value) => setForm({ ...form, title: value, slug: form.slug || slugify(value) })} required />
    <AdminInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} required />
    <AdminInput label="Catégorie" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
    <AdminInput label="Temps de lecture" value={form.readTime} onChange={(value) => setForm({ ...form, readTime: value })} />
    <AdminImageTools title="Image de l'article" description="Upload direct ou dossier Google Drive public." driveFolderUrl={blogDriveFolderUrl} onDriveFolderUrlChange={setBlogDriveFolderUrl} onDriveImport={onDriveImport} onFilesSelected={onFilesSelected} uploading={uploadingImages} />
    <AdminInput label="Image" value={form.image} onChange={(value) => setForm({ ...form, image: value })} />
    <AdminTextarea label="Résumé" value={form.excerpt} onChange={(value) => setForm({ ...form, excerpt: value })} />
    <div className="xl:col-span-2"><AdminTextarea label="Contenu" value={form.content} onChange={(value) => setForm({ ...form, content: value })} rows={12} /></div>
    <div className="flex items-center rounded-lg border border-border bg-card p-4">
      <AdminCheckbox label="Publié" checked={form.published} onChange={(value) => setForm({ ...form, published: value })} />
    </div>
    <SubmitBar saving={saving} label={editing ? "Mettre à jour l'article" : "Publier l'article"} />
  </form>
);

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
};

const getGoogleDriveFolderId = (url: string) => {
  const trimmed = url.trim();
  return trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ?? trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ?? "";
};

const AdminImageTools = ({ title, description, driveFolderUrl, onDriveFolderUrlChange, onDriveImport, onFilesSelected, uploading }: any) => (
  <section className="rounded-lg border border-border bg-card p-4">
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Image className="h-5 w-5" /></div>
      <div>
        <h3 className="font-body text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-3">
      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-body font-semibold transition-colors hover:border-primary/40">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Importer des fichiers
        <input type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => onFilesSelected(event.target.files)} className="sr-only" />
      </label>
      <div className="flex gap-2">
        <input value={driveFolderUrl} onChange={(event) => onDriveFolderUrlChange(event.target.value)} placeholder="Lien dossier Google Drive public" className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary" />
        <button type="button" onClick={onDriveImport} disabled={uploading || !driveFolderUrl.trim()} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-border px-4 text-sm font-body font-semibold transition-colors hover:border-primary/40 disabled:opacity-60">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderInput className="h-4 w-4" />}
          Importer
        </button>
      </div>
      {!googleDrivePublicApi && <p className="text-xs font-body text-muted-foreground">Google Drive nécessite <span className="font-semibold text-foreground">VITE_GOOGLE_DRIVE_PUBLIC_API</span> dans .env.local.</p>}
    </div>
  </section>
);

const AdminInput = ({ label, value, onChange, required, placeholder }: FieldProps) => (
  <label className="block rounded-lg border border-border bg-card p-4">
    <span className="mb-2 block text-sm font-body font-semibold">{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary" />
  </label>
);

const AdminSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) => (
  <label className="block rounded-lg border border-border bg-card p-4">
    <span className="mb-2 block text-sm font-body font-semibold">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);

const AdminTextarea = ({ label, value, onChange, hint, rows = 5 }: FieldProps) => (
  <label className="block rounded-lg border border-border bg-card p-4">
    <span className="mb-1 block text-sm font-body font-semibold">{label}</span>
    {hint && <span className="mb-2 block text-xs font-body text-muted-foreground">{hint}</span>}
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm font-body leading-relaxed outline-none focus:border-primary" />
  </label>
);

const AdminCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <label className="inline-flex items-center gap-2 text-sm font-body font-semibold">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-primary" />
    {label}
  </label>
);

const SubmitBar = ({ saving, label }: { saving: boolean; label: string }) => (
  <div className="xl:col-span-2">
    <button type="submit" disabled={saving} className="brand-primary-button inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-body font-semibold text-primary-foreground disabled:opacity-60">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {label}
    </button>
  </div>
);

const MetricCard = ({ label, value, detail }: { label: string; value: string | number; detail: string }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <p className="text-sm font-body text-muted-foreground">{label}</p>
    <p className="mt-3 font-heading text-4xl font-semibold">{value}</p>
    <p className="mt-2 text-xs font-body text-muted-foreground">{detail}</p>
  </div>
);

const QuickPanel = ({ title, items, empty, getTitle, getMeta, onOpen, actionLabel }: any) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="font-heading text-2xl font-semibold">{title}</h3>
      <button type="button" onClick={onOpen} className="text-sm font-body font-semibold text-primary">{actionLabel}</button>
    </div>
    <div className="space-y-3">
      {items.length ? items.map((item: any) => (
        <div key={item.id} className="rounded-lg bg-secondary p-3">
          <p className="truncate text-sm font-body font-semibold">{getTitle(item)}</p>
          <p className="mt-1 text-xs font-body text-muted-foreground">{getMeta(item)}</p>
        </div>
      )) : <p className="text-sm font-body text-muted-foreground">{empty}</p>}
    </div>
  </div>
);

const ActionCard = ({ title, description, onClick }: { title: string; description: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary/40">
    <Plus className="mb-4 h-5 w-5 text-primary" />
    <h3 className="font-heading text-2xl font-semibold">{title}</h3>
    <p className="mt-2 text-sm font-body leading-relaxed text-muted-foreground">{description}</p>
  </button>
);

const ItemTitle = ({ image, title, subtitle }: { image?: string; title: string; subtitle: string }) => (
  <div className="flex min-w-[260px] items-center gap-3">
    {image ? <img src={image} alt="" className="h-12 w-16 rounded-md object-cover image-grade-luxe" /> : <div className="h-12 w-16 rounded-md bg-secondary" />}
    <div className="min-w-0">
      <p className="truncate font-body text-sm font-semibold text-foreground">{title}</p>
      <p className="truncate text-xs font-body text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

const StatusBadge = ({ active, featured }: { active: boolean; featured: boolean }) => (
  <div className="flex flex-wrap gap-1">
    <span className={`rounded-lg px-2 py-1 text-xs font-body font-semibold ${active ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{active ? "Active" : "Inactive"}</span>
    {featured && <span className="rounded-lg bg-primary px-2 py-1 text-xs font-body font-semibold text-primary-foreground">Mise en avant</span>}
  </div>
);

export default Admin;
