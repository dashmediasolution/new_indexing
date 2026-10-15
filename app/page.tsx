

import { Suspense } from "react";
import HomePageContent from "./home-page-content";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomePageContent />
    </Suspense>
  );
}
