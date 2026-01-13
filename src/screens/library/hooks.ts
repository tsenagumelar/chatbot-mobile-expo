import { router } from "expo-router";

export default function useLibraryScreen() {
  const handleOpenPdf = (pdfId: string) => {
    router.push({
      pathname: "/pdf-viewer",
      params: { id: pdfId },
    });
  };

  const handleBack = () => router.back();

  return {
    handleOpenPdf,
    handleBack,
  };
}
