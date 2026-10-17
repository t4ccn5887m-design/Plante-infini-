import Document, { Html, Head, Main, NextScript } from "next/document";
import { isAtelierAppRoute } from "@/lib/atelierRoute";

const OG_TITLE = "Sevya";
const OG_DESCRIPTION = "Le jardin de vos envies, compris d'avance.";
const PWA_ICON_VERSION = "20261013";
const v = (path) => `${path}?v=${PWA_ICON_VERSION}`;
const OG_IMAGE_PATH = v("/icon-512.png");

class WilderDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const isAdminRoute = ctx.pathname === "/admin";
    const atelierTheme = isAtelierAppRoute(ctx.pathname || "");
    const host = ctx.req?.headers?.host;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (host
        ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${host}`
        : "");

    return { ...initialProps, siteUrl, isAdminRoute, atelierTheme };
  }

  render() {
    const { siteUrl, isAdminRoute, atelierTheme } = this.props;
    const ogImage = siteUrl ? `${siteUrl}${OG_IMAGE_PATH}` : OG_IMAGE_PATH;
    const appTitle = isAdminRoute ? "Sevya Admin" : OG_TITLE;

    return (
      <Html lang="fr" className={atelierTheme ? "atelier-theme" : undefined}>
        <Head>
          {atelierTheme ? (
            <style
              dangerouslySetInnerHTML={{
                __html: "html,body{background-color:#0F1A14;color:#F1ECE2}",
              }}
            />
          ) : null}
          <meta name="application-name" content={appTitle} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content={appTitle} />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#0F1A14" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={OG_TITLE} />
          <meta property="og:title" content={OG_TITLE} />
          <meta property="og:description" content={OG_DESCRIPTION} />
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:alt" content={OG_TITLE} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={OG_TITLE} />
          <meta name="twitter:description" content={OG_DESCRIPTION} />
          <meta name="twitter:image" content={ogImage} />
          {!isAdminRoute && <link rel="manifest" href={v("/manifest.json")} />}
          <link rel="icon" href={v("/favicon.svg")} type="image/svg+xml" />
          <link rel="icon" type="image/png" sizes="32x32" href={v("/favicon-32.png")} />
          <link rel="icon" type="image/png" sizes="16x16" href={v("/favicon-16.png")} />
          <link rel="apple-touch-icon" sizes="180x180" href={v("/apple-touch-icon.png")} />
          <link rel="icon" type="image/png" sizes="192x192" href={v("/icon-192.png")} />
          <link rel="icon" type="image/png" sizes="512x512" href={v("/icon-512.png")} />
          <link rel="shortcut icon" href={v("/favicon-32.png")} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default WilderDocument;
