import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Bold,
  Building2,
  FileText,
  Image,
  Italic,
  LayoutDashboard,
  Link2,
  List,
  ListOrdered,
  Loader2,
  LogOut,
  Pencil,
  Pilcrow,
  Plus,
  Quote,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import {
  AMBIANCE_TYPES,
  CLOSING_TIME_PRESETS,
  EVENT_TYPES,
  EXTERNAL_OPTIONS,
  GUEST_DISPOSITIONS,
  OPTION_FEATURES,
  PRICE_TIERS,
  PRIVATIZATION_TYPES,
  SERVICES,
  SPACE_TYPES,
  VENUE_TYPES,
} from "@/types/venue";
import { isSupabaseConfigured, supabase, type BlogPostInsert, type VenueInsert } from "@/lib/supabase";
import Seo from "@/components/Seo";
import { plainTextToBlogHtml, prepareBlogContentForEditor, sanitizeBlogHtml } from "@/lib/blog-content";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toList = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
const toPresetList = (value: string, options: readonly string[]) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return [];

  const lineValues = trimmedValue.split("\n").map((item) => item.trim()).filter(Boolean);
  const selectedOptions = options.filter((option) => lineValues.includes(option) || trimmedValue.includes(option));

  return selectedOptions.length ? selectedOptions : toList(value).filter((item) => options.includes(item));
};
const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type ReservationOptionForm = {
  name: string;
  capacity: string;
  squareMeters: string;
  description: string;
  imageUrl: string;
};

const isNumericText = (value: string) => /^\d+$/.test(value.trim());

const normalizeReservationOption = (option: ReservationOptionForm): ReservationOptionForm => {
  const name = option.name.trim();
  const capacity = option.capacity.trim();
  const squareMeters = option.squareMeters.trim();
  const description = option.description.trim();
  const imageUrl = option.imageUrl.trim();

  if (isNumericText(name) && capacity && !isNumericText(capacity)) {
    return { name: capacity, capacity: name, squareMeters, description, imageUrl };
  }

  return { name, capacity, squareMeters, description, imageUrl };
};

const parseReservationOptions = (value: string): ReservationOptionForm[] => {
  const options = value
    .split("\n")
    .map((line) => {
      const [name = "", capacity = "", description = "", imageUrl = "", squareMeters = ""] = line.split("|").map((part) => part.trim());
      return normalizeReservationOption({ name, capacity, squareMeters, description, imageUrl });
    });

  return options.length ? options : [{ name: "", capacity: "", squareMeters: "", description: "", imageUrl: "" }];
};

const serializeReservationOptions = (options: ReservationOptionForm[]) =>
  options
    .map(normalizeReservationOption)
    .map((option) => [option.name, option.capacity, option.description, option.imageUrl, option.squareMeters].map((part) => part.trim()).join(" | "))
    .join("\n");

const imageBucket = "wearevents-images";
const maxUploadSizeBytes = 250 * 1024 * 1024;
const maxImageUploadSizeBytes = 1 * 1024 * 1024;
const maxVideoUploadSizeBytes = 20 * 1024 * 1024;
type UploadedMedia = {
  url: string;
  kind: "image" | "video";
  originalSize: number;
  uploadedSize: number;
  compressed: boolean;
  note?: string;
};
type VenueMediaTarget = "principale" | "secondaires" | "video";

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${Math.round((size / 1024 / 1024) * 10) / 10} Mo`;
};

const getFileExtension = (file: File) => file.name.split(".").pop()?.toLowerCase() ?? "";

const getMediaKind = (file: File): UploadedMedia["kind"] | null => {
  const extension = getFileExtension(file);

  if (file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"].includes(extension)) {
    return "image";
  }

  if (file.type.startsWith("video/") || ["mp4", "mov", "m4v", "webm"].includes(extension)) {
    return "video";
  }

  return null;
};

const getUploadContentType = (file: File, kind: UploadedMedia["kind"]) => {
  if (file.type) return file.type;

  const extension = getFileExtension(file);
  if (extension === "mov") return "video/quicktime";
  if (extension === "m4v") return "video/x-m4v";
  if (extension === "webm") return "video/webm";
  if (extension === "mp4") return "video/mp4";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";

  return kind === "video" ? "video/mp4" : "image/jpeg";
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Impossible de compresser l'image sélectionnée."));
    }, type, quality);
  });

const waitForVideoEvent = (video: HTMLVideoElement, eventName: keyof HTMLMediaElementEventMap, timeoutMs = 20_000) =>
  new Promise<void>((resolve, reject) => {
    let timeoutId: number | undefined;
    const handleEvent = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Impossible de lire la vidéo sélectionnée."));
    };
    const cleanup = () => {
      video.removeEventListener(eventName, handleEvent);
      video.removeEventListener("error", handleError);
      if (timeoutId) window.clearTimeout(timeoutId);
    };

    video.addEventListener(eventName, handleEvent, { once: true });
    video.addEventListener("error", handleError, { once: true });

    if (timeoutMs > 0) {
      timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error("La vidéo met trop de temps à être lue par le navigateur."));
      }, timeoutMs);
    }
  });

const getVideoRecorderMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";

  return (
    [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=h264",
      "video/mp4",
    ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ""
  );
};

const getVideoExtensionFromMimeType = (mimeType: string) => (mimeType.includes("mp4") ? "mp4" : "webm");

const decodeImageFile = async (file: File) => {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    return new Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }>((resolve, reject) => {
      const imageUrl = URL.createObjectURL(file);
      const image = new window.Image();

      image.onload = () => {
        URL.revokeObjectURL(imageUrl);
        resolve({
          source: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          close: () => undefined,
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error(`Impossible de lire ${file.name}. Essaie avec une image JPG, PNG ou WebP.`));
      };

      image.src = imageUrl;
    });
  }
};

const compressImageForUpload = async (file: File) => {
  if (file.size <= maxImageUploadSizeBytes) return file;

  const decodedImage = await decodeImageFile(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    decodedImage.close();
    throw new Error("Impossible de préparer la compression de l'image.");
  }

  const longestSide = Math.max(decodedImage.width, decodedImage.height);
  let maxDimension = Math.min(longestSide, 2200);
  let quality = 0.86;
  let bestBlob: Blob | null = null;

  try {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const scale = Math.min(1, maxDimension / longestSide);
      canvas.width = Math.max(1, Math.round(decodedImage.width * scale));
      canvas.height = Math.max(1, Math.round(decodedImage.height * scale));

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(decodedImage.source, 0, 0, canvas.width, canvas.height);

      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
      if (blob.size <= maxImageUploadSizeBytes) {
        return new File([blob], `${slugify(file.name.replace(/\.[^.]+$/, "")) || "image"}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }

      if (quality > 0.52) {
        quality = Math.max(0.52, quality - 0.08);
      } else {
        maxDimension = Math.max(480, Math.round(maxDimension * 0.82));
        quality = 0.82;
      }
    }
  } finally {
    decodedImage.close();
  }

  throw new Error(
    `${file.name} reste trop lourde après compression (${bestBlob ? formatFileSize(bestBlob.size) : "taille inconnue"}). Essaie avec une image moins grande.`,
  );
};

const compressVideoForUpload = async (file: File) => {
  if (file.size <= maxVideoUploadSizeBytes) return file;

  const mimeType = getVideoRecorderMimeType();
  if (!mimeType) {
    throw new Error("La compression vidéo n'est pas supportée par ce navigateur. Essaie avec Chrome ou Edge.");
  }

  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = sourceUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    await waitForVideoEvent(video, "loadedmetadata");

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Impossible de déterminer la durée de la vidéo.");
    }

    const targetBitrate = Math.floor((maxVideoUploadSizeBytes * 8 * 0.72) / duration);
    if (targetBitrate < 180_000) {
      throw new Error(`La vidéo est trop longue pour être compressée à moins de ${formatFileSize(maxVideoUploadSizeBytes)} sans devenir illisible.`);
    }

    const videoBitrate = Math.max(180_000, Math.min(1_800_000, targetBitrate));
    const maxDimension = videoBitrate < 500_000 ? 720 : videoBitrate < 900_000 ? 960 : 1280;
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    canvas.height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer la compression vidéo.");

    const stream = canvas.captureStream(24);
    const capturedSourceStream =
      typeof (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream === "function"
        ? (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream()
        : typeof (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream === "function"
          ? (video as HTMLVideoElement & { mozCaptureStream: () => MediaStream }).mozCaptureStream()
          : null;

    capturedSourceStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
    });

    const recording = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new Error("La compression vidéo a échoué."));
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(";")[0] || mimeType }));
    });

    let animationFrame = 0;
    const drawFrame = () => {
      if (video.paused || video.ended) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      animationFrame = requestAnimationFrame(drawFrame);
    };

    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      await waitForVideoEvent(video, "canplay");
    }
    recorder.start(1000);
    await video.play();
    drawFrame();
    await waitForVideoEvent(video, "ended", 0);

    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (recorder.state !== "inactive") recorder.stop();

    const compressedBlob = await recording;
    stream.getTracks().forEach((track) => track.stop());

    if (compressedBlob.size > maxVideoUploadSizeBytes) {
      throw new Error(
        `${file.name} reste trop lourde après compression (${formatFileSize(compressedBlob.size)}). Essaie une vidéo plus courte ou plus légère.`,
      );
    }

    const extension = getVideoExtensionFromMimeType(mimeType);
    return new File([compressedBlob], `${slugify(file.name.replace(/\.[^.]+$/, "")) || "video"}.${extension}`, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
};

const prepareMediaFileForUpload = async (file: File, kind: UploadedMedia["kind"]) => {
  if (kind === "image") {
    const compressedImage = await compressImageForUpload(file);
    return {
      file: compressedImage,
      compressed: compressedImage !== file,
      note: compressedImage !== file ? `Image compressée de ${formatFileSize(file.size)} à ${formatFileSize(compressedImage.size)}.` : undefined,
    };
  }

  if (file.size <= maxVideoUploadSizeBytes) {
    return { file, compressed: false, note: undefined };
  }

  try {
    const compressedVideo = await compressVideoForUpload(file);
    return {
      file: compressedVideo,
      compressed: compressedVideo !== file,
      note:
        compressedVideo !== file
          ? `Vidéo compressée de ${formatFileSize(file.size)} à ${formatFileSize(compressedVideo.size)}.`
          : undefined,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "compression impossible";

    return {
      file,
      compressed: false,
      note: `Compression vidéo impossible (${reason}). La vidéo originale est envoyée en ${formatFileSize(file.size)}.`,
    };
  }
};

const formatAdminError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : "";

  if (/schema cache|could not find.*column|column .* does not exist/i.test(message)) {
    return `${message} — La base Supabase n'est pas à jour. Relance le SQL de supabase/schema.sql, surtout les lignes ALTER TABLE.`;
  }

  if (/duplicate key|unique constraint|violates unique/i.test(message)) {
    return `${message} — Le slug ou le code lieu existe déjà.`;
  }

  if (/row-level security|permission denied|not authorized|unauthorized/i.test(message)) {
    return `${message} — Vérifie que tu es connecté avec un utilisateur Supabase Auth et que les policies RLS ont été créées.`;
  }

  if (/maximum allowed size|exceeded.*size|file.*too large|payload too large|entity too large/i.test(message)) {
    return `${message} — La vidéo dépasse la limite Supabase. Relance le SQL du bucket puis vérifie aussi la limite globale dans Storage Settings.`;
  }

  if (/mime|content.?type|file type/i.test(message)) {
    return `${message} — Le type du fichier est refusé. Les .mov sont envoyés comme video/quicktime côté app.`;
  }

  if (/bucket|storage|object/i.test(message)) {
    return `${message} — Vérifie que le bucket ${imageBucket} existe et que les policies Storage du schéma ont été appliquées.`;
  }

  return message || "Une erreur inconnue est survenue.";
};

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
  eventCategories: EVENT_TYPES.slice(0, 2).join("\n"),
  venueTypes: VENUE_TYPES.slice(0, 1).join("\n"),
  services: SERVICES.slice(0, 4).join("\n"),
  spaces: "Salle principale | 120 | Espace principal modulable",
  accessDetails: "",
  usefulInformation: "",
  pricingText: "",
  coverImage: "",
  gallery: "",
  videoUrl: "",
  videoStartSeconds: "0",
  videoEndSeconds: "",
  tiktokUrl: "",
  googleReviewUrl: "",
  priceTier: "€€",
  closingTime: "02:00",
  ambianceTypes: AMBIANCE_TYPES.slice(0, 2).join("\n"),
  externalOptions: EXTERNAL_OPTIONS.slice(0, 1).join("\n"),
  privatizationTypes: PRIVATIZATION_TYPES.slice(0, 1).join("\n"),
  guestDispositions: GUEST_DISPOSITIONS.slice(0, 1).join("\n"),
  spaceTypes: SPACE_TYPES.slice(0, 1).join("\n"),
  optionFeatures: OPTION_FEATURES.slice(0, 1).join("\n"),
  metroAccess: "",
  featured: true,
  active: true,
  contactEmail: "",
  rating: "0",
  reviewCount: "0",
});

type VenueFormState = ReturnType<typeof createEmptyVenueForm>;
const venueDraftStorageKey = "wearevents-admin-venue-draft";

const getNextVenueCodeFromVenues = (venues: any[]) => {
  const maxCode = venues.reduce((max, venue) => {
    const numericCode = Number(String(venue.venue_code ?? "").replace(/\D/g, ""));
    return Number.isFinite(numericCode) ? Math.max(max, numericCode) : max;
  }, 1000);

  return String(maxCode + 1).padStart(4, "0").slice(-4);
};

const readVenueDraft = (): VenueFormState | null => {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.localStorage.getItem(venueDraftStorageKey);
    if (!rawDraft) return null;
    const parsed = JSON.parse(rawDraft);

    if (!parsed || typeof parsed !== "object") return null;

    return { ...createEmptyVenueForm(), ...(parsed as Partial<VenueFormState>) };
  } catch {
    return null;
  }
};

const writeVenueDraft = (form: VenueFormState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(venueDraftStorageKey, JSON.stringify(form));
};

const clearVenueDraft = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(venueDraftStorageKey);
};

const createEmptyBlogForm = () => ({
  title: "",
  slug: "",
  category: "",
  excerpt: "",
  content: "",
  readTime: "",
  image: "",
  secondaryKeywords: "",
  seoTitle: "",
  metaDescription: "",
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
  const [importingVenue, setImportingVenue] = useState(false);
  const [venueImportUrl, setVenueImportUrl] = useState("");
  const [message, setMessage] = useState("");
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
    if (venuesResult.error) setMessage(formatAdminError(venuesResult.error));
    if (!blogResult.error) setAdminBlogPosts(blogResult.data ?? []);
    if (blogResult.error) setMessage(formatAdminError(blogResult.error));
  };

  useEffect(() => {
    loadAdminRecords();
  }, [session]);

  useEffect(() => {
    if (modal !== "venue" || editingVenueId) return;
    writeVenueDraft(venueForm);
  }, [editingVenueId, modal, venueForm]);

  const canSubmit = useMemo(() => Boolean(supabase && session), [session]);
  const activeVenues = adminVenues.filter((venue) => venue.active).length;
  const featuredVenues = adminVenues.filter((venue) => venue.featured).length;
  const publishedPosts = adminBlogPosts.filter((post) => post.published).length;

  const uploadMediaFiles = async (files: FileList | File[], folder: string, acceptedKinds: Array<UploadedMedia["kind"]>) => {
    if (!supabase) return [];
    const uploads: UploadedMedia[] = [];

    for (const [index, file] of Array.from(files).entries()) {
      if (file.size > maxUploadSizeBytes) {
        throw new Error(`${file.name} fait ${formatFileSize(file.size)}. La limite configurée côté app est ${formatFileSize(maxUploadSizeBytes)}.`);
      }

      const kind = getMediaKind(file);

      if (!kind || !acceptedKinds.includes(kind)) continue;

      const preparedMedia = await prepareMediaFileForUpload(file, kind);
      const uploadFile = preparedMedia.file;
      const extension = getFileExtension(uploadFile) || (kind === "video" ? "mp4" : "jpg");
      const safeName = slugify(uploadFile.name.replace(/\.[^.]+$/, "")) || "image";
      const path = `${folder}/${Date.now()}-${index + 1}-${safeName}.${extension}`;
      const { error } = await supabase.storage.from(imageBucket).upload(path, uploadFile, {
        cacheControl: "31536000",
        contentType: getUploadContentType(uploadFile, kind),
        upsert: false,
      });
      if (error) throw error;
      uploads.push({
        kind,
        url: supabase.storage.from(imageBucket).getPublicUrl(path).data.publicUrl,
        originalSize: file.size,
        uploadedSize: uploadFile.size,
        compressed: preparedMedia.compressed,
        note: preparedMedia.note,
      });
    }

    return uploads;
  };

  const applyBlogImageUrls = (urls: string[]) => {
    if (!urls.length) return;
    setBlogForm((current) => ({ ...current, image: urls[0] }));
  };

  const getVenueMediaFolder = () => {
    const folderName = slugify(venueForm.title) || venueForm.slug;
    if (!folderName) throw new Error("Renseigne le nom de la salle avant d'importer ses médias.");
    return `venues/${folderName}`;
  };

  const getBlogMediaFolder = () => {
    const folderName = slugify(blogForm.title) || blogForm.slug;
    if (!folderName) throw new Error("Renseigne le titre de l'article avant d'importer son image.");
    return `blog/${folderName}`;
  };

  const handleVenueMediaUpload = async (files: FileList | null, target: VenueMediaTarget) => {
    if (!files?.length) return;
    setUploadingImages(true);
    setMessage("");

    try {
      const folder = `${getVenueMediaFolder()}/${target}`;
      const acceptedKinds: Array<UploadedMedia["kind"]> = target === "video" ? ["video"] : ["image"];
      const selectedFiles = target === "secondaires" ? Array.from(files) : Array.from(files).slice(0, 1);
      const media = await uploadMediaFiles(selectedFiles, folder, acceptedKinds);
      if (!media.length) {
        throw new Error(target === "video" ? "Sélectionne une vidéo." : "Sélectionne au moins une image.");
      }

      const urls = media.map((item) => item.url);

      setVenueForm((current) => {
        if (target === "principale") {
          return { ...current, coverImage: urls[0] };
        }

        if (target === "secondaires") {
          return { ...current, gallery: [...toList(current.gallery), ...urls].join("\n") };
        }

        return { ...current, videoUrl: urls[0] };
      });

      const targetLabel =
        target === "principale" ? "Image principale" : target === "secondaires" ? "Images secondaires" : "Vidéo";
      const importNotes = media.map((item) => item.note).filter(Boolean);
      setMessage(
        [
          `${targetLabel} importée${urls.length > 1 ? "s" : ""} dans ${imageBucket}/${folder}.`,
          ...importNotes,
        ].join(" "),
      );
    } catch (error) {
      setMessage(formatAdminError(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleVenueMainImageUpload = (files: FileList | null) => handleVenueMediaUpload(files, "principale");
  const handleVenueGalleryImagesUpload = (files: FileList | null) => handleVenueMediaUpload(files, "secondaires");
  const handleVenueVideoUpload = (files: FileList | null) => handleVenueMediaUpload(files, "video");

  const handleVenueOptionImageUpload = async (optionIndex: number, files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    setMessage("");

    try {
      const folder = `${getVenueMediaFolder()}/options/option-${optionIndex + 1}`;
      const media = await uploadMediaFiles(Array.from(files).slice(0, 1), folder, ["image"]);
      if (!media.length) throw new Error("Sélectionne une image pour cette option.");

      const imageUrl = media[0].url;
      setVenueForm((current) => {
        const options = parseReservationOptions(current.spaces);
        const nextOptions = options.map((option, index) =>
          index === optionIndex ? { ...option, imageUrl } : option,
        );
        return { ...current, spaces: serializeReservationOptions(nextOptions) };
      });

      const importNotes = media.map((item) => item.note).filter(Boolean);
      setMessage([`Photo de l'option ${optionIndex + 1} importée dans ${imageBucket}/${folder}.`, ...importNotes].join(" "));
    } catch (error) {
      setMessage(formatAdminError(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleBlogImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    setMessage("");

    try {
      const folder = getBlogMediaFolder();
      const media = await uploadMediaFiles(files, folder, ["image"]);
      if (!media.length) throw new Error("Sélectionne au moins une image.");
      applyBlogImageUrls(media.map((item) => item.url));
      const importNotes = media.map((item) => item.note).filter(Boolean);
      setMessage(["Image de l'article importée.", ...importNotes].join(" "));
    } catch (error) {
      setMessage(formatAdminError(error));
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
  };

  const openCreateVenue = () => {
    const draft = readVenueDraft();
    setVenueForm(draft ?? { ...createEmptyVenueForm(), venueCode: getNextVenueCodeFromVenues(adminVenues) });
    setVenueImportUrl("");
    setEditingVenueId(null);
    setMessage(draft ? "Dernier brouillon de salle récupéré." : "");
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

    try {
      const spaces = parseReservationOptions(venueForm.spaces)
        .map((option, index) => {
          const normalizedOption = normalizeReservationOption(option);
          return {
            id: slugify(normalizedOption.name) || `space-${index + 1}`,
            name: normalizedOption.name,
            capacity: toNumber(normalizedOption.capacity),
            squareMeters: normalizedOption.squareMeters ? toNumber(normalizedOption.squareMeters) : undefined,
            description: normalizedOption.description,
            imageUrl: normalizedOption.imageUrl || undefined,
          };
        })
        .filter((space) => space.name);

      const payload: VenueInsert = {
        title: venueForm.title.trim(),
        slug: (venueForm.slug || slugify(venueForm.title)).trim(),
        tagline: venueForm.tagline,
        description: venueForm.description,
        city: venueForm.city.trim(),
        address: venueForm.address.trim(),
        location: { lat: toNumber(venueForm.lat), lng: toNumber(venueForm.lng) },
        venue_code: venueForm.venueCode.replace(/\D/g, "").slice(0, 4),
        min_capacity: toNumber(venueForm.minCapacity),
        max_capacity: toNumber(venueForm.maxCapacity),
        event_categories: toPresetList(venueForm.eventCategories, EVENT_TYPES),
        venue_types: toPresetList(venueForm.venueTypes, VENUE_TYPES),
        services: toPresetList(venueForm.services, SERVICES),
        spaces,
        access_details: toList(venueForm.accessDetails),
        useful_information: toList(venueForm.usefulInformation),
        pricing_text: venueForm.pricingText,
        cover_image: venueForm.coverImage.trim(),
        gallery: toList(venueForm.gallery),
        video_url: venueForm.videoUrl.trim() || null,
        video_start_seconds: toNumber(venueForm.videoStartSeconds),
        video_end_seconds: venueForm.videoEndSeconds ? toNumber(venueForm.videoEndSeconds) : null,
        tiktok_url: venueForm.tiktokUrl.trim() || null,
        google_review_url: venueForm.googleReviewUrl,
        price_tier: venueForm.priceTier as "€" | "€€" | "€€€" | "€€€€",
        closing_time: venueForm.closingTime,
        ambiance_types: toPresetList(venueForm.ambianceTypes, AMBIANCE_TYPES),
        external_options: toPresetList(venueForm.externalOptions, EXTERNAL_OPTIONS),
        privatization_types: toPresetList(venueForm.privatizationTypes, PRIVATIZATION_TYPES),
        guest_dispositions: toPresetList(venueForm.guestDispositions, GUEST_DISPOSITIONS),
        space_types: toPresetList(venueForm.spaceTypes, SPACE_TYPES),
        option_features: toPresetList(venueForm.optionFeatures, OPTION_FEATURES),
        metro_access: venueForm.metroAccess.trim() || null,
        featured: venueForm.featured,
        active: venueForm.active,
        contact_email: venueForm.contactEmail.trim(),
        rating: toNumber(venueForm.rating),
        review_count: toNumber(venueForm.reviewCount),
      };

      if (!payload.title) throw new Error("Le nom de la salle est obligatoire.");
      if (!payload.slug) throw new Error("Le slug est obligatoire.");
      if (!/^\d{4}$/.test(payload.venue_code)) throw new Error("Le code lieu doit contenir exactement 4 chiffres.");
      if (!payload.city) throw new Error("La ville est obligatoire.");
      if (!payload.address) throw new Error("L'adresse est obligatoire.");
      if (!payload.contact_email) throw new Error("L'email contact est obligatoire.");
      if (!payload.cover_image) throw new Error("Ajoute une image principale avant d'enregistrer la salle.");
      if (!spaces.length) throw new Error("Ajoute au moins une option de réservation.");
      if (spaces.some((space) => isNumericText(space.name))) {
        throw new Error("Le nom d'une option de réservation ne peut pas être seulement un nombre. Mets par exemple Salle principale, puis la capacité dans le champ Capacité.");
      }

      const { error } = editingVenueId
        ? await supabase.from("venues").update(payload).eq("id", editingVenueId)
        : await supabase.from("venues").insert(payload);

      if (error) throw error;

      if (!editingVenueId) clearVenueDraft();
      setMessage(editingVenueId ? "Salle mise à jour." : "Salle ajoutée.");
      closeModal();
      loadAdminRecords();
      setView("venues");
    } catch (error) {
      setMessage(formatAdminError(error));
    } finally {
      setSaving(false);
    }
  };

  const applyImportedVenue = (importedVenue: any) => {
    const importedSpaces = Array.isArray(importedVenue.spaces) && importedVenue.spaces.length
      ? importedVenue.spaces
      : [{ name: "Salle principale", capacity: importedVenue.maxCapacity || "", squareMeters: "", description: "" }];
    const toLines = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).join("\n") : "";

    setVenueForm((current) => ({
      ...current,
      title: importedVenue.title ?? current.title,
      slug: importedVenue.slug || slugify(importedVenue.title || current.title),
      tagline: importedVenue.tagline ?? current.tagline,
      description: importedVenue.description ?? current.description,
      city: importedVenue.city ?? current.city,
      address: importedVenue.address ?? current.address,
      lat: importedVenue.lat ?? current.lat,
      lng: importedVenue.lng ?? current.lng,
      venueCode: importedVenue.venueCode || current.venueCode || getNextVenueCodeFromVenues(adminVenues),
      minCapacity: importedVenue.minCapacity ?? current.minCapacity,
      maxCapacity: importedVenue.maxCapacity ?? current.maxCapacity,
      eventCategories: toLines(importedVenue.eventCategories),
      venueTypes: toLines(importedVenue.venueTypes),
      services: toLines(importedVenue.services),
      spaces: serializeReservationOptions(
        importedSpaces.map((space: any) => ({
          name: String(space.name ?? ""),
          capacity: String(space.capacity ?? ""),
          squareMeters: String(space.squareMeters ?? ""),
          description: String(space.description ?? ""),
          imageUrl: String(space.imageUrl ?? ""),
        })),
      ),
      usefulInformation: toLines(importedVenue.usefulInformation),
      pricingText: importedVenue.pricingText ?? current.pricingText,
      coverImage: importedVenue.coverImage || current.coverImage,
      gallery: toLines(importedVenue.gallery) || current.gallery,
      priceTier: importedVenue.priceTier || current.priceTier,
      closingTime: importedVenue.closingTime ?? current.closingTime,
      ambianceTypes: toLines(importedVenue.ambianceTypes),
      externalOptions: toLines(importedVenue.externalOptions),
      privatizationTypes: toLines(importedVenue.privatizationTypes),
      guestDispositions: toLines(importedVenue.guestDispositions),
      spaceTypes: toLines(importedVenue.spaceTypes),
      optionFeatures: toLines(importedVenue.optionFeatures),
      metroAccess: importedVenue.metroAccess ?? current.metroAccess,
      contactEmail: importedVenue.contactEmail ?? current.contactEmail,
      rating: importedVenue.rating || current.rating,
      reviewCount: importedVenue.reviewCount || current.reviewCount,
      googleReviewUrl: importedVenue.googleReviewUrl ?? current.googleReviewUrl,
    }));
  };

  const handleVenueAiImport = async () => {
    if (!session?.access_token) {
      setMessage("Connecte-toi avant de lancer l'import IA.");
      return;
    }

    if (!venueImportUrl.trim()) {
      setMessage("Renseigne un lien de fiche salle à importer.");
      return;
    }

    setImportingVenue(true);
    setMessage("");

    try {
      const response = await fetch("/api/import-venue-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url: venueImportUrl.trim() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Import IA impossible.");
      }

      applyImportedVenue(payload.venue);
      const warningCount = Array.isArray(payload.warnings) ? payload.warnings.length : 0;
      const imageCount = [payload.venue?.coverImage, ...(payload.venue?.gallery ?? [])].filter(Boolean).length;
      setMessage(
        [
          `Import IA terminé. Code lieu proposé : ${payload.venue?.venueCode || "à vérifier"}.`,
          imageCount ? `${imageCount} image${imageCount > 1 ? "s" : ""} importée${imageCount > 1 ? "s" : ""}.` : "Aucune image importée automatiquement.",
          warningCount ? `${warningCount} point${warningCount > 1 ? "s" : ""} à vérifier.` : "",
        ].filter(Boolean).join(" "),
      );
    } catch (error) {
      setMessage(formatAdminError(error));
    } finally {
      setImportingVenue(false);
    }
  };

  const handleBlogSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !canSubmit) return;
    setSaving(true);
    setMessage("");

    try {
      const payload: BlogPostInsert = {
        title: blogForm.title.trim(),
        slug: (blogForm.slug || slugify(blogForm.title)).trim(),
        category: blogForm.category,
        excerpt: blogForm.excerpt,
        content: sanitizeBlogHtml(blogForm.content),
        read_time: blogForm.readTime,
        image: blogForm.image,
        secondary_keywords: toList(blogForm.secondaryKeywords),
        seo_title: blogForm.seoTitle.trim(),
        meta_description: blogForm.metaDescription.trim(),
        published: blogForm.published,
        published_at: blogForm.published ? new Date().toISOString() : null,
      };

      if (!payload.title) throw new Error("Le titre est obligatoire.");
      if (!payload.slug) throw new Error("Le slug est obligatoire.");

      const { error } = editingBlogId
        ? await supabase.from("blog_posts").update(payload).eq("id", editingBlogId)
        : await supabase.from("blog_posts").insert(payload);

      if (error) throw error;

      setMessage(editingBlogId ? "Article mis à jour." : "Article ajouté.");
      closeModal();
      loadAdminRecords();
      setView("blogs");
    } catch (error) {
      setMessage(formatAdminError(error));
    } finally {
      setSaving(false);
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
      eventCategories: (venue.event_categories ?? []).join("\n"),
      venueTypes: (venue.venue_types ?? []).join("\n"),
      services: (venue.services ?? []).join("\n"),
      spaces: serializeReservationOptions(
        (venue.spaces ?? []).map((space: any) => ({
          name: String(space.name ?? ""),
          capacity: String(space.capacity ?? ""),
          squareMeters: String(space.squareMeters ?? ""),
          description: String(space.description ?? ""),
          imageUrl: String(space.imageUrl ?? ""),
        })),
      ),
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
      ambianceTypes: (venue.ambiance_types ?? []).join("\n"),
      externalOptions: (venue.external_options ?? []).join("\n"),
      privatizationTypes: (venue.privatization_types ?? []).join("\n"),
      guestDispositions: (venue.guest_dispositions ?? []).join("\n"),
      spaceTypes: ((venue.space_types ?? []).length ? venue.space_types : (venue.option_features ?? []).filter((option: string) => SPACE_TYPES.includes(option as typeof SPACE_TYPES[number]))).join("\n"),
      optionFeatures: (venue.option_features ?? []).filter((option: string) => !SPACE_TYPES.includes(option as typeof SPACE_TYPES[number])).join("\n"),
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
      content: prepareBlogContentForEditor(post.content ?? ""),
      readTime: post.read_time ?? "",
      image: post.image ?? "",
      secondaryKeywords: (post.secondary_keywords ?? []).join("\n"),
      seoTitle: post.seo_title ?? "",
      metaDescription: post.meta_description ?? "",
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
      <Seo title="Back office - Wearevents" description="Espace privé Wearevents." path="/admin" noindex />
      <header className="border-b border-border bg-card px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="font-body text-sm font-semibold text-primary">Wearevents</p>
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
        <AdminModal title={editingVenueId ? "Modifier la salle" : "Ajouter une salle"} message={message} onClose={closeModal}>
          <VenueForm
            form={venueForm}
            setForm={setVenueForm}
            saving={saving}
            editing={Boolean(editingVenueId)}
            onSubmit={handleVenueSubmit}
            onMainImageSelected={handleVenueMainImageUpload}
            onGalleryImagesSelected={handleVenueGalleryImagesUpload}
            onVideoSelected={handleVenueVideoUpload}
            onOptionImageSelected={handleVenueOptionImageUpload}
            uploadingImages={uploadingImages}
            importUrl={venueImportUrl}
            onImportUrlChange={setVenueImportUrl}
            onImportVenue={handleVenueAiImport}
            importingVenue={importingVenue}
          />
        </AdminModal>
      )}
      {modal === "blog" && (
        <AdminModal title={editingBlogId ? "Modifier l'article" : "Ajouter un article"} message={message} onClose={closeModal}>
          <BlogForm
            form={blogForm}
            setForm={setBlogForm}
            saving={saving}
            editing={Boolean(editingBlogId)}
            onSubmit={handleBlogSubmit}
            onFilesSelected={handleBlogImageUpload}
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
                      <button type="button" onClick={() => onEdit(row)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-body font-semibold transition-colors hover:border-primary/40 hover:text-primary" aria-label="Modifier">
                        <Pencil className="h-4 w-4" />
                        Modifier
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

const AdminModal = ({ title, message, onClose, children }: { title: string; message?: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" onClick={onClose} />
    <section className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-background luxury-shadow">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-lg border border-border p-2 hover:border-primary/40" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="overflow-y-auto p-5">
        {message && (
          <div className="mb-5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-body text-muted-foreground">
            {message}
          </div>
        )}
        {children}
      </div>
    </section>
  </div>
);

const VenueForm = ({
  form,
  setForm,
  saving,
  editing,
  onSubmit,
  onMainImageSelected,
  onGalleryImagesSelected,
  onVideoSelected,
  onOptionImageSelected,
  uploadingImages,
  importUrl,
  onImportUrlChange,
  onImportVenue,
  importingVenue,
}: any) => (
  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
    <VenueAiImportPanel
      value={importUrl}
      onChange={onImportUrlChange}
      onImport={onImportVenue}
      importing={importingVenue}
    />
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
    <AdminPresetSelect label="Horaires" value={form.closingTime} onChange={(value) => setForm({ ...form, closingTime: value })} options={CLOSING_TIME_PRESETS} />
    <AdminInput label="Accès métro" value={form.metroAccess} onChange={(value) => setForm({ ...form, metroAccess: value })} placeholder="Ex: George V, ligne 1" />
    <AdminMediaField
      title="Image principale"
      description="Upload dans venues/nom-de-la-salle/principale/. Cette image devient la couverture de la fiche."
      accept="image/*"
      fieldLabel="URL image principale"
      value={form.coverImage}
      onChange={(value) => setForm({ ...form, coverImage: value })}
      onFilesSelected={onMainImageSelected}
      uploading={uploadingImages}
      required
    />
    <AdminMediaField
      title="Images secondaires"
      description="Upload dans venues/nom-de-la-salle/secondaires/. Les URLs sont ajoutées à la galerie."
      accept="image/*"
      fieldLabel="URLs images secondaires"
      value={form.gallery}
      onChange={(value) => setForm({ ...form, gallery: value })}
      onFilesSelected={onGalleryImagesSelected}
      uploading={uploadingImages}
      multiple
      multiline
    />
    <AdminMediaField
      title="Vidéo"
      description="Upload dans venues/nom-de-la-salle/video/. La vidéo remplira l'URL vidéo de la salle."
      accept="video/*"
      fieldLabel="URL vidéo"
      value={form.videoUrl}
      onChange={(value) => setForm({ ...form, videoUrl: value })}
      onFilesSelected={onVideoSelected}
      uploading={uploadingImages}
    />
    <AdminTextarea label="Accroche" value={form.tagline} onChange={(value) => setForm({ ...form, tagline: value })} />
    <AdminTextarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
    <AdminMultiSelect label="Catégories d'événements" value={form.eventCategories} onChange={(value) => setForm({ ...form, eventCategories: value })} options={EVENT_TYPES} />
    <AdminMultiSelect label="Type de lieu" value={form.venueTypes} onChange={(value) => setForm({ ...form, venueTypes: value })} options={VENUE_TYPES} />
    <AdminMultiSelect label="Équipements & services" value={form.services} onChange={(value) => setForm({ ...form, services: value })} options={SERVICES} />
    <AdminMultiSelect label="Types d'ambiance" value={form.ambianceTypes} onChange={(value) => setForm({ ...form, ambianceTypes: value })} options={AMBIANCE_TYPES} />
    <AdminMultiSelect label="Nourriture & boissons externes" value={form.externalOptions} onChange={(value) => setForm({ ...form, externalOptions: value })} options={EXTERNAL_OPTIONS} />
    <AdminMultiSelect label="Types de privatisation" value={form.privatizationTypes} onChange={(value) => setForm({ ...form, privatizationTypes: value })} options={PRIVATIZATION_TYPES} />
    <AdminMultiSelect label="Disposition des invités" value={form.guestDispositions} onChange={(value) => setForm({ ...form, guestDispositions: value })} options={GUEST_DISPOSITIONS} />
    <AdminMultiSelect label="Type d'espace" value={form.spaceTypes} onChange={(value) => setForm({ ...form, spaceTypes: value })} options={SPACE_TYPES} />
    <AdminMultiSelect label="Options du lieu" value={form.optionFeatures} onChange={(value) => setForm({ ...form, optionFeatures: value })} options={OPTION_FEATURES} />
    <ReservationOptionsField
      value={form.spaces}
      onChange={(value) => setForm({ ...form, spaces: value })}
      onOptionImageSelected={onOptionImageSelected}
      uploadingImages={uploadingImages}
    />
    <AdminTextarea label="Informations utiles" value={form.usefulInformation} onChange={(value) => setForm({ ...form, usefulInformation: value })} />
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

const VenueAiImportPanel = ({
  value,
  onChange,
  onImport,
  importing,
}: {
  value: string;
  onChange: (value: string) => void;
  onImport: () => void;
  importing: boolean;
}) => (
  <section className="rounded-lg border border-primary/25 bg-primary/5 p-4 xl:col-span-2">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-body text-sm font-semibold">Préremplir avec l'IA</h3>
            <p className="mt-0.5 font-body text-xs leading-relaxed text-muted-foreground">
              Collez une fiche salle publique. L'import lit la page, propose le prochain code lieu et importe les premières images trouvées.
            </p>
          </div>
        </div>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://www.privateaser.com/lieu/..."
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary"
        />
      </div>
      <button
        type="button"
        disabled={importing || !value.trim()}
        onClick={onImport}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-body font-semibold text-background transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {importing ? "Analyse en cours..." : "Importer avec l'IA"}
      </button>
    </div>
  </section>
);

const BlogForm = ({ form, setForm, saving, editing, onSubmit, onFilesSelected, uploadingImages }: any) => (
  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-2">
    <AdminInput label="Titre" value={form.title} onChange={(value) => setForm({ ...form, title: value, slug: form.slug || slugify(value) })} required />
    <AdminInput label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} required />
    <AdminInput label="Catégorie" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
    <AdminInput label="Temps de lecture" value={form.readTime} onChange={(value) => setForm({ ...form, readTime: value })} />
    <AdminMediaField
      title="Image de l'article"
      description="Upload dans blog/titre-de-l-article/."
      accept="image/*"
      fieldLabel="URL image"
      value={form.image}
      onChange={(value) => setForm({ ...form, image: value })}
      onFilesSelected={onFilesSelected}
      uploading={uploadingImages}
    />
    <AdminTextarea label="Résumé" value={form.excerpt} onChange={(value) => setForm({ ...form, excerpt: value })} />
    <div className="grid gap-4 xl:col-span-2 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <p className="font-body text-sm font-semibold">SEO de l'article</p>
        <p className="mt-1 font-body text-xs text-muted-foreground">
          Ces champs pilotent le title Google, la meta description et les mots clés secondaires.
        </p>
      </div>
      <AdminInput
        label="Title SEO"
        value={form.seoTitle}
        onChange={(value) => setForm({ ...form, seoTitle: value })}
        placeholder={form.title || "Ex : Réserver une salle pour un anniversaire à Paris"}
      />
      <AdminTextarea
        label="Meta description"
        value={form.metaDescription}
        onChange={(value) => setForm({ ...form, metaDescription: value })}
        hint="Idéalement 140 à 160 caractères."
        rows={4}
      />
      <div className="xl:col-span-2">
        <AdminTextarea
          label="Mots clés secondaires"
          value={form.secondaryKeywords}
          onChange={(value) => setForm({ ...form, secondaryKeywords: value })}
          hint="Un mot clé par ligne, ou séparés par des virgules."
          rows={4}
        />
      </div>
    </div>
    <div className="xl:col-span-2">
      <BlogRichTextEditor
        value={form.content}
        onChange={(value) => setForm({ ...form, content: value })}
      />
    </div>
    <div className="flex items-center rounded-lg border border-border bg-card p-4">
      <AdminCheckbox label="Publié" checked={form.published} onChange={(value) => setForm({ ...form, published: value })} />
    </div>
    <SubmitBar saving={saving} label={editing ? "Mettre à jour l'article" : "Publier l'article"} />
  </form>
);

const BlogRichTextEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const nextValue = prepareBlogContentForEditor(value);
    if (editor.innerHTML !== nextValue) editor.innerHTML = nextValue;
  }, [value]);

  useEffect(() => {
    const saveCurrentSelection = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        selectionRef.current = range.cloneRange();
      }
    };

    document.addEventListener("selectionchange", saveCurrentSelection);
    return () => document.removeEventListener("selectionchange", saveCurrentSelection);
  }, []);

  const publishValue = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;

    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const runCommand = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, commandValue);
    publishValue();
  };

  const addLink = () => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) {
      window.alert("Sélectionne d'abord le texte qui doit devenir un lien.");
      return;
    }

    const href = window.prompt("Adresse du lien");
    if (!href) return;

    const normalizedHref = /^(https?:|mailto:|tel:|\/|#)/i.test(href)
      ? href
      : `https://${href}`;
    runCommand("createLink", normalizedHref);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const clipboardHtml = event.clipboardData.getData("text/html");
    const clipboardText = event.clipboardData.getData("text/plain");
    const pastedHtml = clipboardHtml || plainTextToBlogHtml(clipboardText);
    const safeHtml = sanitizeBlogHtml(pastedHtml);

    restoreSelection();
    document.execCommand("insertHTML", false, safeHtml);
    publishValue();
  };

  const toolbarButtons = [
    { label: "Paragraphe", icon: <Pilcrow className="h-4 w-4" />, onClick: () => runCommand("formatBlock", "<p>") },
    { label: "Gras", icon: <Bold className="h-4 w-4" />, onClick: () => runCommand("bold") },
    { label: "Italique", icon: <Italic className="h-4 w-4" />, onClick: () => runCommand("italic") },
    { label: "Liste à puces", icon: <List className="h-4 w-4" />, onClick: () => runCommand("insertUnorderedList") },
    { label: "Liste numérotée", icon: <ListOrdered className="h-4 w-4" />, onClick: () => runCommand("insertOrderedList") },
    { label: "Citation", icon: <Quote className="h-4 w-4" />, onClick: () => runCommand("formatBlock", "<blockquote>") },
    { label: "Ajouter un lien", icon: <Link2 className="h-4 w-4" />, onClick: addLink },
    { label: "Annuler", icon: <Undo2 className="h-4 w-4" />, onClick: () => runCommand("undo") },
    { label: "Rétablir", icon: <Redo2 className="h-4 w-4" />, onClick: () => runCommand("redo") },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-body font-semibold">Contenu de l'article</h3>
        <p className="mt-1 text-xs font-body text-muted-foreground">
          Sélectionnez du texte puis appliquez un titre, du gras, de l'italique, une liste ou un lien.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/50 p-2">
        {(["h1", "h2", "h3"] as const).map((heading) => (
          <button
            key={heading}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("formatBlock", `<${heading}>`)}
            className="flex h-9 min-w-11 items-center justify-center rounded-md border border-border bg-background px-2 text-xs font-body font-bold uppercase transition-colors hover:border-primary/50 hover:text-primary"
            title={`Titre ${heading.toUpperCase()}`}
            aria-label={`Titre ${heading.toUpperCase()}`}
          >
            {heading.toUpperCase()}
          </button>
        ))}

        <span className="mx-1 h-6 w-px bg-border" />

        {toolbarButtons.map((button) => (
          <button
            key={button.label}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.onClick}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-colors hover:border-border hover:bg-background"
            title={button.label}
            aria-label={button.label}
          >
            {button.icon}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={publishValue}
        onPaste={handlePaste}
        onMouseUp={() => {
          const selection = window.getSelection();
          if (selection?.rangeCount) selectionRef.current = selection.getRangeAt(0).cloneRange();
        }}
        onKeyUp={() => {
          const selection = window.getSelection();
          if (selection?.rangeCount) selectionRef.current = selection.getRangeAt(0).cloneRange();
        }}
        className="prose prose-neutral min-h-[360px] max-h-[55vh] max-w-none overflow-y-auto scroll-smooth bg-background px-5 py-5 font-body outline-none focus:ring-2 focus:ring-primary/20 prose-headings:font-heading prose-headings:font-semibold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-a:font-medium prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-blockquote:border-primary prose-blockquote:text-foreground/70 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-primary prose-strong:text-foreground"
        aria-label="Contenu de l'article"
      />
    </section>
  );
};

const ReservationOptionsField = ({
  value,
  onChange,
  onOptionImageSelected,
  uploadingImages,
}: {
  value: string;
  onChange: (value: string) => void;
  onOptionImageSelected: (index: number, files: FileList | null) => void;
  uploadingImages: boolean;
}) => {
  const options = parseReservationOptions(value);

  const updateOption = (index: number, patch: Partial<ReservationOptionForm>) => {
    const nextOptions = options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, ...patch } : option,
    );
    onChange(serializeReservationOptions(nextOptions));
  };

  const addOption = () => {
    onChange(serializeReservationOptions([...options, { name: "", capacity: "", squareMeters: "", description: "", imageUrl: "" }]));
  };

  const removeOption = (index: number) => {
    const nextOptions = options.filter((_option, optionIndex) => optionIndex !== index);
    onChange(serializeReservationOptions(nextOptions.length ? nextOptions : [{ name: "", capacity: "", squareMeters: "", description: "", imageUrl: "" }]));
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4 xl:col-span-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-body font-semibold">Options de réservation</h3>
          <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">
            Créez les espaces sélectionnables dans la demande de disponibilité : salle principale, salle secondaire, annexe, terrasse...
          </p>
          <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">
            Le champ Nom est affiché sur la carte de réservation. La capacité et la surface apparaissent seulement si elles sont renseignées.
          </p>
        </div>
        <button
          type="button"
          onClick={addOption}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-body font-semibold transition-colors hover:border-primary/40"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-body font-semibold text-primary">Option {index + 1}</p>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 text-xs font-body font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[10rem_minmax(0,1fr)_8rem_8rem]">
              <div className="md:row-span-2">
                <span className="mb-2 block text-xs font-body font-semibold text-muted-foreground">Photo</span>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {option.imageUrl ? (
                    <img src={option.imageUrl} alt={option.name || `Option ${index + 1}`} className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center bg-secondary text-muted-foreground">
                      <Image className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <label className="mt-2 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-body font-semibold transition-colors hover:border-primary/40">
                  {uploadingImages ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploadingImages ? "Import..." : "Importer"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImages}
                    onChange={(event) => {
                      onOptionImageSelected(index, event.target.files);
                      event.currentTarget.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <label>
                <span className="mb-2 block text-xs font-body font-semibold text-muted-foreground">Nom</span>
                <input
                  value={option.name}
                  onChange={(event) => updateOption(index, { name: event.target.value })}
                  placeholder="Salle principale"
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-body outline-none focus:border-primary"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-body font-semibold text-muted-foreground">Capacité</span>
                <input
                  type="number"
                  value={option.capacity}
                  onChange={(event) => updateOption(index, { capacity: event.target.value })}
                  placeholder="120 pers."
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-body outline-none focus:border-primary"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-body font-semibold text-muted-foreground">Surface m²</span>
                <input
                  type="number"
                  value={option.squareMeters}
                  onChange={(event) => updateOption(index, { squareMeters: event.target.value })}
                  placeholder="180"
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-body outline-none focus:border-primary"
                />
              </label>
              <label className="md:col-span-3">
                <span className="mb-2 block text-xs font-body font-semibold text-muted-foreground">Description</span>
                <textarea
                  value={option.description}
                  onChange={(event) => updateOption(index, { description: event.target.value })}
                  rows={3}
                  placeholder="Espace principal modulable, idéal pour cocktails, dîners et soirées privées."
                  className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm font-body leading-relaxed outline-none focus:border-primary"
                />
              </label>
              <label className="md:col-span-4">
                <span className="mb-2 block text-xs font-body font-semibold text-muted-foreground">URL photo de l'option</span>
                <input
                  value={option.imageUrl}
                  onChange={(event) => updateOption(index, { imageUrl: event.target.value })}
                  placeholder={`Upload dans venues/nom-de-la-salle/options/option-${index + 1}/`}
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-body outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
};

const AdminMediaField = ({
  title,
  description,
  accept,
  fieldLabel,
  value,
  onChange,
  onFilesSelected,
  uploading,
  multiple = false,
  multiline = false,
  required = false,
}: any) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const compressesImages = typeof accept === "string" && accept.includes("image");
  const compressesVideos = typeof accept === "string" && accept.includes("video");

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Image className="h-5 w-5" /></div>
        <div>
          <h3 className="font-body text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-body font-semibold transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Import en cours..." : "Importer"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={uploading}
          onChange={(event) => {
            onFilesSelected(event.target.files);
            event.currentTarget.value = "";
          }}
          className="hidden"
        />
        <label className="block">
          <span className="mb-2 block text-xs font-body font-semibold text-muted-foreground">{fieldLabel}</span>
          {multiline ? (
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm font-body leading-relaxed outline-none focus:border-primary"
            />
          ) : (
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              required={required}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary"
            />
          )}
        </label>
        <p className="text-xs font-body text-muted-foreground">
          {compressesImages ? "Les images sont compressées automatiquement à moins de 1 Mo. " : ""}
          {compressesVideos ? `Les vidéos de plus de ${formatFileSize(maxVideoUploadSizeBytes)} sont compressées si le navigateur le permet, sinon l'original est envoyé jusqu'à ${formatFileSize(maxUploadSizeBytes)}. ` : ""}
          Le dossier est créé automatiquement au premier upload.
        </p>
      </div>
    </section>
  );
};

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

const AdminPresetSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
}) => (
  <label className="block rounded-lg border border-border bg-card p-4">
    <span className="mb-2 block text-sm font-body font-semibold">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-body outline-none focus:border-primary">
      <option value="">Non renseigné</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

const AdminMultiSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) => {
  const values = toPresetList(value, options);
  const toggle = (option: string) => {
    const nextValues = values.includes(option)
      ? values.filter((item) => item !== option)
      : [...values, option];
    onChange(nextValues.join("\n"));
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <span className="mb-3 block text-sm font-body font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`rounded-lg border px-3 py-2 text-xs font-body font-semibold transition-colors ${
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
};

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
