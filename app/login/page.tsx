
import { Suspense } from "react";
import LoginPageContent from "../compponents/LoginPAgeContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginPageContent />
    </Suspense>
  );
}
