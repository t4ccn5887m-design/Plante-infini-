import { createT, detectLang } from "@/lib/i18n";

function ErrorPage({ statusCode }) {
  const t = createT(typeof window !== "undefined" ? detectLang() : "fr");
  const isServerError = statusCode && statusCode >= 500;

  return (
    <div className="app-error-fallback" role="alert">
      <img src="/logowilder.png" alt="" className="app-error-fallback-logo" />
      <h1 className="app-error-fallback-title">
        {isServerError ? t("error_boundary.server_title") : t("error_boundary.title")}
      </h1>
      <p className="app-error-fallback-body">{t("error_boundary.body")}</p>
      <div className="app-error-fallback-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        >
          {t("error_boundary.retry")}
        </button>
        <a className="btn-secondary app-error-fallback-home-link" href="/">
          {t("error_boundary.home")}
        </a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
