import { RouterProvider } from "react-router-dom";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { router } from "@/router";

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="assetflow-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
