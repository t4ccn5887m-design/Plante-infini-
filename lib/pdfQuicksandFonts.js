let quicksandLoadPromise = null;

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Enregistre Quicksand dans pdfmake (Roboto reste disponible via vfs_fonts). */
export async function ensureQuicksandFonts(pdfMake) {
  if (!pdfMake || typeof window === "undefined") return;
  if (pdfMake.__sevyaQuicksandReady) return;

  if (!quicksandLoadPromise) {
    quicksandLoadPromise = (async () => {
      const [regRes, boldRes] = await Promise.all([
        fetch("/fonts/Quicksand-Regular.ttf"),
        fetch("/fonts/Quicksand-Bold.ttf"),
      ]);
      if (!regRes.ok || !boldRes.ok) {
        throw new Error("quicksand_font_fetch_failed");
      }
      const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
      return {
        "Quicksand-Regular.ttf": arrayBufferToBase64(regBuf),
        "Quicksand-Bold.ttf": arrayBufferToBase64(boldBuf),
      };
    })();
  }

  try {
    const vfsEntries = await quicksandLoadPromise;
    pdfMake.addVirtualFileSystem(vfsEntries);
    pdfMake.addFonts({
      Quicksand: {
        normal: "Quicksand-Regular.ttf",
        bold: "Quicksand-Bold.ttf",
        italics: "Quicksand-Regular.ttf",
        bolditalics: "Quicksand-Bold.ttf",
      },
    });
    pdfMake.__sevyaQuicksandReady = true;
  } catch (error) {
    console.warn("[Sevya] pdf: Quicksand unavailable, fallback Roboto", error);
  }
}

export function gardenPdfFontFamily(pdfMake) {
  return pdfMake?.__sevyaQuicksandReady ? "Quicksand" : "Roboto";
}
