
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import IndexingPage from "./compponents/Indexing-page";

export default async function HomePageContent() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <IndexingPage />;
}
