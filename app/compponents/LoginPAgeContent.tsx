
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "../compponents/login-form";

export default async function LoginPageContent() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  return <LoginForm />;
}
