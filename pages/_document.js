import Document, { Html, Head, Main, NextScript } from "next/document";

const OG_TITLE = "Wilder";
const OG_DESCRIPTION = "Explorez la nature autour de vous";
const PWA_ICON_VERSION = "20250605";
const v = (path) => `${path}?v=${PWA_ICON_VERSION}`;
const OG_IMAGE_PATH = v("/icon-512.png");

class WilderDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const host = ctx.req?.headers?.host;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (host
        ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${host}`
        : "");

    return { ...initialProps, siteUrl };
  }

  render() {
    const { siteUrl } = this.props;
    const ogImage = siteUrl ? `${siteUrl}${OG_IMAGE_PATH}` : OG_IMAGE_PATH;

    return (
      <Html lang="fr">
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
          <meta name="application-name" content="Wilder" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Wilder" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#1B3D2F" />
          <meta name="description" content={OG_DESCRIPTION} />
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
          <link rel="manifest" href={v("/manifest.json")} />
          <link rel="icon" href={v("/icon.svg")} type="image/svg+xml" />
          <link rel="apple-touch-icon" sizes="180x180" href={v("/icon-180.png")} />
          <link rel="apple-touch-icon" sizes="192x192" href={v("/icon-192.png")} />
          <link rel="icon" type="image/png" sizes="32x32" href={v("/favicon-32.png")} />
          <link rel="icon" type="image/png" sizes="192x192" href={v("/icon-192.png")} />
          <link rel="icon" type="image/png" sizes="512x512" href={v("/icon-512.png")} />
          <link rel="shortcut icon" href={v("/favicon.ico")} />
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
