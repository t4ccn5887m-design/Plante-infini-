import { useState, useEffect, useCallback, useRef } from "react";
import { compressDataUrl } from "@/lib/compressImage";
import {
  createPotagerCommunityPost,
  fetchNearbyPotagerPosts,
} from "@/lib/potagerCommunity";
import { getCurrentLocation, requestLocationPermission } from "@/lib/permissions";

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function CommunityPostItem({ post, t }) {
  const isSurplus = post.kind === "surplus";
  const plantsLabel = (post.plants || []).join(", ");

  return (
    <article className={`potager-community-post potager-community-post--${post.kind}`}>
      {post.photo && (
        <img src={post.photo} alt="" className="potager-community-post-photo" />
      )}
      <div className="potager-community-post-body">
        <p className="potager-community-post-kind">
          {isSurplus
            ? t("themes.potager.community_surplus_badge")
            : t("themes.potager.community_harvest_badge")}
        </p>
        {plantsLabel && (
          <p className="potager-community-post-plants">{plantsLabel}</p>
        )}
        {post.comment && <p className="potager-community-post-comment">{post.comment}</p>}
        <p className="potager-community-post-meta">
          {post.placeName && <span>{post.placeName}</span>}
          {post.placeName && post.distanceKm != null && <span aria-hidden="true"> · </span>}
          {post.distanceKm != null && (
            <span>{t("themes.potager.community_distance", { km: post.distanceKm })}</span>
          )}
        </p>
      </div>
    </article>
  );
}

function PotagerCommunityModal({
  title,
  children,
  submitLabel,
  onClose,
  onSubmit,
  submitting,
  submitDisabled,
  t,
}) {
  return (
    <div className="modal-overlay potager-modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content potager-modal potager-community-modal">
        <h2>{title}</h2>
        {children}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            {t("albums.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onSubmit}
            disabled={submitting || submitDisabled}
          >
            {submitting ? t("themes.potager.community_posting") : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PotagerCommunityCard({ harvestPlants, t }) {
  const [posts, setPosts] = useState([]);
  const [feedStatus, setFeedStatus] = useState("idle");
  const [offline, setOffline] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [modal, setModal] = useState(null);
  const [comment, setComment] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [postSuccess, setPostSuccess] = useState(null);
  const fileRef = useRef(null);

  const loadFeed = useCallback(async () => {
    setFeedStatus("loading");
    const location = await getCurrentLocation();
    if (!location) {
      setNeedsLocation(true);
      setPosts([]);
      setFeedStatus("needs_location");
      return;
    }
    setNeedsLocation(false);
    const { posts: list, offline: isOffline, needsLocation: locNeeded } =
      await fetchNearbyPotagerPosts(location);
    if (locNeeded) {
      setNeedsLocation(true);
      setPosts([]);
      setFeedStatus("needs_location");
      return;
    }
    setPosts(list);
    setOffline(isOffline);
    setFeedStatus(list.length ? "ready" : "empty");
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const resetModal = () => {
    setModal(null);
    setComment("");
    setPhotoPreview(null);
    setSelectedPlants([]);
    setPostError(null);
  };

  const openHarvestModal = () => {
    setComment("");
    setPhotoPreview(null);
    setPostError(null);
    setPostSuccess(null);
    setModal("harvest");
  };

  const openSurplusModal = () => {
    const names = harvestPlants.map((p) => p.name).filter(Boolean);
    setComment("");
    setPhotoPreview(null);
    setSelectedPlants(names);
    setPostError(null);
    setPostSuccess(null);
    setModal("surplus");
  };

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      const compressed = await compressDataUrl(dataUrl, 720, 0.55);
      setPhotoPreview(compressed);
      setPostError(null);
    } catch {
      setPostError(t("themes.potager.community_photo_error"));
    }
  };

  const handleEnableLocation = async () => {
    const result = await requestLocationPermission();
    if (result.ok) loadFeed();
  };

  const submitPost = async (kind) => {
    setSubmitting(true);
    setPostError(null);
    try {
      const location = await getCurrentLocation({ refresh: true });
      if (!location) {
        setPostError(t("themes.potager.community_location_required"));
        return;
      }

      const plants =
        kind === "surplus"
          ? selectedPlants
          : harvestPlants.map((p) => p.name).filter(Boolean);

      const { ok, shared } = await createPotagerCommunityPost({
        kind,
        comment,
        photo: kind === "harvest" ? photoPreview : null,
        plants,
        latitude: location.latitude,
        longitude: location.longitude,
        placeName: location.placeName,
      });

      if (!ok) {
        setPostError(t("themes.potager.community_post_error"));
        return;
      }

      const successMsg = shared
        ? t("themes.potager.community_post_success")
        : t("themes.potager.community_post_success_local");
      resetModal();
      setPostSuccess(successMsg);
      await loadFeed();
    } catch {
      setPostError(t("themes.potager.community_post_error"));
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlant = (name) => {
    setSelectedPlants((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <section className="potager-community" aria-labelledby="potager-community-heading">
      <div className="potager-community-head">
        <h2 id="potager-community-heading" className="potager-community-title">
          {t("themes.potager.community_title")}
        </h2>
        <p className="potager-community-subtitle">{t("themes.potager.community_subtitle")}</p>
      </div>

      <div className="potager-community-actions">
        <button type="button" className="potager-community-btn" onClick={openHarvestModal}>
          <span className="potager-community-btn-icon" aria-hidden="true">
            📸
          </span>
          {t("themes.potager.community_share_harvest")}
        </button>
        <button type="button" className="potager-community-btn potager-community-btn--alert" onClick={openSurplusModal}>
          <span className="potager-community-btn-icon" aria-hidden="true">
            🥕
          </span>
          {t("themes.potager.community_surplus_alert")}
        </button>
      </div>

      {postSuccess && (
        <p className="potager-community-toast" role="status">
          {postSuccess}
        </p>
      )}

      {needsLocation ? (
        <div className="potager-community-location">
          <p>{t("themes.potager.community_no_location")}</p>
          <button type="button" className="potager-community-location-btn" onClick={handleEnableLocation}>
            {t("themes.potager.community_enable_location")}
          </button>
        </div>
      ) : (
        <>
          {offline && (
            <p className="potager-community-offline">{t("themes.potager.community_offline_hint")}</p>
          )}
          {feedStatus === "loading" && (
            <p className="potager-community-loading">{t("themes.potager.community_loading")}</p>
          )}
          {feedStatus === "empty" && (
            <p className="potager-community-empty">{t("themes.potager.community_empty")}</p>
          )}
          {feedStatus === "ready" && posts.length > 0 && (
            <div className="potager-community-feed">
              <h3 className="potager-community-feed-title">{t("themes.potager.community_nearby")}</h3>
              {posts.map((post) => (
                <CommunityPostItem key={post.id} post={post} t={t} />
              ))}
            </div>
          )}
        </>
      )}

      {modal === "harvest" && (
        <PotagerCommunityModal
          title={t("themes.potager.community_share_harvest")}
          submitLabel={t("themes.potager.community_publish")}
          onClose={resetModal}
          onSubmit={() => submitPost("harvest")}
          submitting={submitting}
          submitDisabled={!photoPreview}
          t={t}
        >
          <label className="potager-modal-label">{t("themes.potager.community_photo_label")}</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="potager-community-file"
            onChange={handlePhotoPick}
          />
          <button
            type="button"
            className="potager-community-photo-btn"
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview
              ? t("themes.potager.community_change_photo")
              : t("themes.potager.community_add_photo")}
          </button>
          {photoPreview && (
            <img src={photoPreview} alt="" className="potager-community-preview" />
          )}
          <label className="potager-modal-label">{t("themes.potager.community_comment_label")}</label>
          <textarea
            className="modal-input potager-community-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("themes.potager.community_comment_placeholder")}
            rows={3}
            maxLength={500}
          />
          {postError && <p className="potager-community-error">{postError}</p>}
        </PotagerCommunityModal>
      )}

      {modal === "surplus" && (
        <PotagerCommunityModal
          title={t("themes.potager.community_surplus_alert")}
          submitLabel={t("themes.potager.community_send_alert")}
          onClose={resetModal}
          onSubmit={() => submitPost("surplus")}
          submitting={submitting}
          submitDisabled={selectedPlants.length === 0 && !comment.trim()}
          t={t}
        >
          <p className="potager-community-modal-hint">{t("themes.potager.community_surplus_hint")}</p>
          {harvestPlants.length > 0 ? (
            <>
              <label className="potager-modal-label">{t("themes.potager.community_surplus_plants")}</label>
              <div className="potager-community-plant-picks">
                {harvestPlants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`potager-community-plant-pick${
                      selectedPlants.includes(p.name) ? " active" : ""
                    }`}
                    onClick={() => togglePlant(p.name)}
                    aria-pressed={selectedPlants.includes(p.name)}
                  >
                    <span aria-hidden="true">{p.emoji}</span> {p.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="potager-community-modal-note">{t("themes.potager.community_surplus_no_harvest")}</p>
          )}
          <label className="potager-modal-label">{t("themes.potager.community_comment_label")}</label>
          <textarea
            className="modal-input potager-community-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("themes.potager.community_surplus_placeholder")}
            rows={3}
            maxLength={500}
          />
          {postError && <p className="potager-community-error">{postError}</p>}
        </PotagerCommunityModal>
      )}
    </section>
  );
}
