import { notFound } from "next/navigation";
import PrivateOpeningPage from "../프라이빗개방/page";

export { metadata } from "../프라이빗개방/page";

type SlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;

  if (decodeURIComponent(slug) !== "프라이빗개방") {
    notFound();
  }

  return <PrivateOpeningPage />;
}
