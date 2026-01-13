import { PDF_LIBRARY } from "@/src/data/pdfLibrary";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export default function usePdfScreen() {
  const params = useLocalSearchParams();
  const pdfId = params.id as string;
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pdfFile = PDF_LIBRARY.find((pdf) => pdf.id === pdfId);

  useEffect(() => {
    loadPdf();
  }, []);

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!pdfFile) {
        setError("File tidak ditemukan");
        return;
      }

      if (pdfFile.url) {
        setPdfUri(pdfFile.url);
      } else {
        setError(
          "URL PDF belum tersedia. Upload file ke server/cloud storage terlebih dahulu."
        );
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Gagal memuat PDF");
    } finally {
      setLoading(false);
    }
  };

  const renderPdfHtml = (uri: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              height: 100vh;
              overflow: hidden;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(
            uri
          )}&embedded=true"></iframe>
        </body>
      </html>
    `;

  const handleBack = () => router.back();

  const handleWebViewError = () => {
    setError("Gagal memuat PDF di WebView");
  };

  return {
    pdfFile,
    pdfUri,
    loading,
    error,
    renderPdfHtml,
    handleBack,
    handleWebViewError,
  };
}
