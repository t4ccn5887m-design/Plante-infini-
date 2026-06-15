import { Component } from "react";
import { createT, detectLang } from "@/lib/i18n";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[Wilder] UI error:", error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleHome = () => {
    this.setState({ error: null });
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const t = createT(detectLang());

    return (
      <div className="app-error-fallback" role="alert">
        <img src="/logowilder.png" alt="" className="app-error-fallback-logo" />
        <h1 className="app-error-fallback-title">{t("error_boundary.title")}</h1>
        <p className="app-error-fallback-body">{t("error_boundary.body")}</p>
        <div className="app-error-fallback-actions">
          <button type="button" className="btn-primary" onClick={this.handleRetry}>
            {t("error_boundary.retry")}
          </button>
          <button type="button" className="btn-secondary" onClick={this.handleHome}>
            {t("error_boundary.home")}
          </button>
        </div>
      </div>
    );
  }
}
