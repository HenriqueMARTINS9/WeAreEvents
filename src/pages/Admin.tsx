import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Building2, FileText, FolderInput, Image, Loader2, LogOut, Save, Upload } from "lucide-react";
import { blogPosts } from "@/data/blog";
import { mockVenues } from "@/data/venues";
import { EVENT_TYPES, SERVICES } from "@/types/venue";
import { isSupabaseConfigured, supabase, type BlogPostInsert, type VenueInsert } from "@/lib/supabase";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toList = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const defaultVenue = mockVenues[0];
const defaultBlogPost = blogPosts[0];
const googleDrivePublicApi = import.meta.env.VITE_GOOGLE_DRIVE_PUBLIC_API;
const imageBucket = "wearevents-images";

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"venue" | "blog">("venue");
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [message, setMessage] = useState("");
  const [venueDriveFolderUrl, setVenueDriveFolderUrl] = useState("");
  const [blogDriveFolderUrl, setBlogDriveFolderUrl] = useState("");

  const [venueForm, setVenueForm] = useState({
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
    tiktokUrl: "",
    googleReviewUrl: "",
    featured: true,
    active: true,
    contactEmail: "",
    rating: "0",
    reviewCount: "0",
  });

  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    category: defaultBlogPost.category,
    excerpt: "",
    content: "",
    readTime: defaultBlogPost.readTime,
    image: defaultBlogPost.image,
    published: true,
  });

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

  const canSubmit = useMemo(() => Boolean(supabase && session), [session]);

  const uploadImages = async (files: FileList | File[], folder: string) => {
    if (!supabase) return [];

    const fileArray = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const urls: string[] = [];

    for (const file of fileArray) {
      const extension = file.name.split(".").pop() || "jpg";
      const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
      const path = `${folder}/${Date.now()}-${safeName}.${extension}`;
      const { error } = await supabase.storage.from(imageBucket).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });

      if (error) throw error;

      const { data } = supabase.storage.from(imageBucket).getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  };

  const applyVenueImageUrls = (urls: string[]) => {
    if (!urls.length) return;

    const [coverImage, ...galleryImages] = urls;
    const existingGallery = toList(venueForm.gallery);

    setVenueForm({
      ...venueForm,
      coverImage,
      gallery: [...galleryImages, ...existingGallery].join("\n"),
    });
  };

  const applyBlogImageUrls = (urls: string[]) => {
    if (!urls.length) return;
    setBlogForm({ ...blogForm, image: urls[0] });
  };

  const handleVenueImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploadingImages(true);
    setMessage("");

    try {
      const folder = `venues/${venueForm.slug || slugify(venueForm.title) || "nouvelle-salle"}`;
      applyVenueImageUrls(await uploadImages(files, folder));
      setMessage("Images importées : la première est l'image principale, les autres sont dans la galerie.");
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

    if (!folderId) {
      throw new Error("Lien Google Drive invalide.");
    }

    if (!googleDrivePublicApi) {
      throw new Error("Ajoute VITE_GOOGLE_DRIVE_PUBLIC_API dans .env.local pour importer un dossier Google Drive.");
    }

    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id,name,mimeType)",
      orderBy: "name",
      key: googleDrivePublicApi,
    });
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error?.message || "Impossible de lire ce dossier Google Drive.");
    }

    return (json.files ?? []).map((file: { id: string }) => `https://drive.google.com/uc?export=view&id=${file.id}`);
  };

  const handleVenueDriveImport = async () => {
    setUploadingImages(true);
    setMessage("");

    try {
      const urls = await importDriveFolder(venueDriveFolderUrl);
      applyVenueImageUrls(urls);
      setMessage("Images Google Drive importées : la première est l'image principale, les autres sont dans la galerie.");
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
      const urls = await importDriveFolder(blogDriveFolderUrl);
      applyBlogImageUrls(urls);
      setMessage("Image Google Drive importée pour l'article.");
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

  const handleVenueSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !canSubmit) return;

    setSaving(true);
    setMessage("");

    const spaces = venueForm.spaces
      .split("\n")
      .map((line, index) => {
        const [name = "", capacity = "0", description = ""] = line.split("|").map((part) => part.trim());
        return {
          id: slugify(name) || `space-${index + 1}`,
          name,
          capacity: toNumber(capacity),
          description,
        };
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
      venue_code: venueForm.venueCode,
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
      tiktok_url: venueForm.tiktokUrl || null,
      google_review_url: venueForm.googleReviewUrl,
      featured: venueForm.featured,
      active: venueForm.active,
      contact_email: venueForm.contactEmail,
      rating: toNumber(venueForm.rating),
      review_count: toNumber(venueForm.reviewCount),
    };

    const { error } = await supabase.from("venues").insert(payload);
    setSaving(false);
    setMessage(error ? error.message : "Salle ajoutée dans Supabase.");
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

    const { error } = await supabase.from("blog_posts").insert(payload);
    setSaving(false);
    setMessage(error ? error.message : "Article ajouté dans Supabase.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="font-body text-sm font-semibold text-primary">WeAreEvents</p>
            <h1 className="font-heading text-3xl font-semibold">Back office</h1>
          </div>
          {session && supabase && (
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-body font-semibold transition-colors hover:border-primary/40"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!isSupabaseConfigured && (
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-heading text-2xl font-semibold">Supabase n'est pas encore configuré</h2>
            <p className="mt-3 max-w-3xl text-sm font-body leading-relaxed text-muted-foreground">
              Crée un projet Supabase, exécute le SQL dans <span className="font-semibold text-foreground">supabase/schema.sql</span>,
              puis ajoute <span className="font-semibold text-foreground">VITE_SUPABASE_URL</span> et{" "}
              <span className="font-semibold text-foreground">VITE_SUPABASE_PUBLISHABLE</span> dans un fichier .env local.
            </p>
          </section>
        )}

        {isSupabaseConfigured && !session && (
          <form onSubmit={handleLogin} className="max-w-md rounded-lg border border-border bg-card p-6 luxury-shadow">
            <h2 className="font-heading text-2xl font-semibold">Connexion admin</h2>
            <p className="mt-2 text-sm font-body text-muted-foreground">
              Utilise un utilisateur créé dans Supabase Auth. Les politiques SQL limitent l'écriture aux comptes authentifiés.
            </p>
            <div className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mot de passe"
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="brand-primary-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-body font-semibold text-primary-foreground disabled:opacity-60"
              >
                {authLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Se connecter
              </button>
            </div>
          </form>
        )}

        {session && (
          <>
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("venue")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-body font-semibold transition-colors ${
                  activeTab === "venue" ? "bg-foreground text-primary-foreground" : "border border-border bg-card"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Ajouter une salle
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("blog")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-body font-semibold transition-colors ${
                  activeTab === "blog" ? "bg-foreground text-primary-foreground" : "border border-border bg-card"
                }`}
              >
                <FileText className="h-4 w-4" />
                Ajouter un blog
              </button>
            </div>

            {activeTab === "venue" ? (
              <form onSubmit={handleVenueSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <AdminInput label="Nom de la salle" value={venueForm.title} onChange={(value) => setVenueForm({ ...venueForm, title: value, slug: venueForm.slug || slugify(value) })} required />
                <AdminInput label="Slug" value={venueForm.slug} onChange={(value) => setVenueForm({ ...venueForm, slug: value })} required />
                <AdminInput label="Code lieu" value={venueForm.venueCode} onChange={(value) => setVenueForm({ ...venueForm, venueCode: value })} required />
                <AdminInput label="Email contact" value={venueForm.contactEmail} onChange={(value) => setVenueForm({ ...venueForm, contactEmail: value })} required />
                <AdminInput label="Ville" value={venueForm.city} onChange={(value) => setVenueForm({ ...venueForm, city: value })} required />
                <AdminInput label="Adresse" value={venueForm.address} onChange={(value) => setVenueForm({ ...venueForm, address: value })} required />
                <AdminInput label="Latitude" value={venueForm.lat} onChange={(value) => setVenueForm({ ...venueForm, lat: value })} />
                <AdminInput label="Longitude" value={venueForm.lng} onChange={(value) => setVenueForm({ ...venueForm, lng: value })} />
                <AdminInput label="Capacité minimum" value={venueForm.minCapacity} onChange={(value) => setVenueForm({ ...venueForm, minCapacity: value })} />
                <AdminInput label="Capacité maximum" value={venueForm.maxCapacity} onChange={(value) => setVenueForm({ ...venueForm, maxCapacity: value })} />
                <AdminInput label="Prix indicatif" value={venueForm.pricingText} onChange={(value) => setVenueForm({ ...venueForm, pricingText: value })} />
                <AdminImageTools
                  title="Images de la salle"
                  description="Upload direct ou dossier Google Drive public. La première image devient l'image principale, les autres alimentent la galerie."
                  driveFolderUrl={venueDriveFolderUrl}
                  onDriveFolderUrlChange={setVenueDriveFolderUrl}
                  onDriveImport={handleVenueDriveImport}
                  onFilesSelected={handleVenueImageUpload}
                  uploading={uploadingImages}
                />
                <AdminInput label="Image principale" value={venueForm.coverImage} onChange={(value) => setVenueForm({ ...venueForm, coverImage: value })} required />
                <AdminTextarea label="Accroche" value={venueForm.tagline} onChange={(value) => setVenueForm({ ...venueForm, tagline: value })} />
                <AdminTextarea label="Description" value={venueForm.description} onChange={(value) => setVenueForm({ ...venueForm, description: value })} />
                <AdminTextarea label="Catégories d'événements" hint="Sépare par virgule ou ligne." value={venueForm.eventCategories} onChange={(value) => setVenueForm({ ...venueForm, eventCategories: value })} />
                <AdminTextarea label="Services" hint="Sépare par virgule ou ligne." value={venueForm.services} onChange={(value) => setVenueForm({ ...venueForm, services: value })} />
                <AdminTextarea label="Espaces" hint="Une ligne par espace : Nom | Capacité | Description" value={venueForm.spaces} onChange={(value) => setVenueForm({ ...venueForm, spaces: value })} />
                <AdminTextarea label="Galerie" hint="Une URL par ligne." value={venueForm.gallery} onChange={(value) => setVenueForm({ ...venueForm, gallery: value })} />
                <AdminTextarea label="Accès" value={venueForm.accessDetails} onChange={(value) => setVenueForm({ ...venueForm, accessDetails: value })} />
                <AdminTextarea label="Informations utiles" value={venueForm.usefulInformation} onChange={(value) => setVenueForm({ ...venueForm, usefulInformation: value })} />
                <AdminInput label="URL vidéo" value={venueForm.videoUrl} onChange={(value) => setVenueForm({ ...venueForm, videoUrl: value })} />
                <AdminInput label="URL TikTok" value={venueForm.tiktokUrl} onChange={(value) => setVenueForm({ ...venueForm, tiktokUrl: value })} />
                <AdminInput label="URL avis Google" value={venueForm.googleReviewUrl} onChange={(value) => setVenueForm({ ...venueForm, googleReviewUrl: value })} />
                <div className="flex items-center gap-6 rounded-lg border border-border bg-card p-4">
                  <AdminCheckbox label="Mise en avant" checked={venueForm.featured} onChange={(value) => setVenueForm({ ...venueForm, featured: value })} />
                  <AdminCheckbox label="Active" checked={venueForm.active} onChange={(value) => setVenueForm({ ...venueForm, active: value })} />
                </div>
                <SubmitBar saving={saving} label="Enregistrer la salle" />
              </form>
            ) : (
              <form onSubmit={handleBlogSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <AdminInput label="Titre" value={blogForm.title} onChange={(value) => setBlogForm({ ...blogForm, title: value, slug: blogForm.slug || slugify(value) })} required />
                <AdminInput label="Slug" value={blogForm.slug} onChange={(value) => setBlogForm({ ...blogForm, slug: value })} required />
                <AdminInput label="Catégorie" value={blogForm.category} onChange={(value) => setBlogForm({ ...blogForm, category: value })} />
                <AdminInput label="Temps de lecture" value={blogForm.readTime} onChange={(value) => setBlogForm({ ...blogForm, readTime: value })} />
                <AdminImageTools
                  title="Image de l'article"
                  description="Upload direct ou dossier Google Drive public. La première image sera utilisée comme visuel de l'article."
                  driveFolderUrl={blogDriveFolderUrl}
                  onDriveFolderUrlChange={setBlogDriveFolderUrl}
                  onDriveImport={handleBlogDriveImport}
                  onFilesSelected={handleBlogImageUpload}
                  uploading={uploadingImages}
                />
                <AdminInput label="Image" value={blogForm.image} onChange={(value) => setBlogForm({ ...blogForm, image: value })} />
                <AdminTextarea label="Résumé" value={blogForm.excerpt} onChange={(value) => setBlogForm({ ...blogForm, excerpt: value })} />
                <div className="xl:col-span-2">
                  <AdminTextarea label="Contenu" value={blogForm.content} onChange={(value) => setBlogForm({ ...blogForm, content: value })} rows={12} />
                </div>
                <div className="flex items-center rounded-lg border border-border bg-card p-4">
                  <AdminCheckbox label="Publié" checked={blogForm.published} onChange={(value) => setBlogForm({ ...blogForm, published: value })} />
                </div>
                <SubmitBar saving={saving} label="Publier l'article" />
              </form>
            )}
          </>
        )}

        {message && (
          <div className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-sm font-body text-muted-foreground">
            {message}
          </div>
        )}
      </main>
    </div>
  );
};

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  rows?: number;
};

const getGoogleDriveFolderId = (url: string) => {
  const trimmed = url.trim();
  return trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ?? trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ?? "";
};

const AdminImageTools = ({
  title,
  description,
  driveFolderUrl,
  onDriveFolderUrlChange,
  onDriveImport,
  onFilesSelected,
  uploading,
}: {
  title: string;
  description: string;
  driveFolderUrl: string;
  onDriveFolderUrlChange: (value: string) => void;
  onDriveImport: () => void;
  onFilesSelected: (files: FileList | null) => void;
  uploading: boolean;
}) => (
  <section className="rounded-lg border border-border bg-card p-4">
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <Image className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-body text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3">
      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-body font-semibold transition-colors hover:border-primary/40">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Importer des fichiers
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(event) => onFilesSelected(event.target.files)}
          className="sr-only"
        />
      </label>

      <div className="flex gap-2">
        <input
          value={driveFolderUrl}
          onChange={(event) => onDriveFolderUrlChange(event.target.value)}
          placeholder="Lien dossier Google Drive public"
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={onDriveImport}
          disabled={uploading || !driveFolderUrl.trim()}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-border px-4 text-sm font-body font-semibold transition-colors hover:border-primary/40 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderInput className="h-4 w-4" />}
          Importer
        </button>
      </div>

      {!googleDrivePublicApi && (
        <p className="text-xs font-body text-muted-foreground">
          Google Drive nécessite <span className="font-semibold text-foreground">VITE_GOOGLE_DRIVE_PUBLIC_API</span> dans .env.local.
        </p>
      )}
    </div>
  </section>
);

const AdminInput = ({ label, value, onChange, required }: FieldProps) => (
  <label className="block rounded-lg border border-border bg-card p-4">
    <span className="mb-2 block text-sm font-body font-semibold">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary"
    />
  </label>
);

const AdminTextarea = ({ label, value, onChange, hint, rows = 5 }: FieldProps) => (
  <label className="block rounded-lg border border-border bg-card p-4">
    <span className="mb-1 block text-sm font-body font-semibold">{label}</span>
    {hint && <span className="mb-2 block text-xs font-body text-muted-foreground">{hint}</span>}
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm font-body leading-relaxed outline-none focus:border-primary"
    />
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
    <button
      type="submit"
      disabled={saving}
      className="brand-primary-button inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-body font-semibold text-primary-foreground disabled:opacity-60"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {label}
    </button>
  </div>
);

export default Admin;
