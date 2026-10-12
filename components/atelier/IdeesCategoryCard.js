/** Carte univers Idées — photo plein cadre + dégradé (maquette Atelier). */
export default function IdeesCategoryCard({ title, count, photoUrl, onClick }) {
  return (
    <button type="button" className="atelier-category-card" onClick={onClick}>
      {photoUrl ? (
        <img className="atelier-category-card__photo" src={photoUrl} alt="" />
      ) : (
        <div className="atelier-category-card__photo atelier-category-card__photo--empty" />
      )}
      <div className="atelier-category-card__shade" aria-hidden="true" />
      <div className="atelier-category-card__body">
        <span className="atelier-category-card__count">{count}</span>
        <b className="atelier-category-card__title">{title}</b>
      </div>
    </button>
  );
}
