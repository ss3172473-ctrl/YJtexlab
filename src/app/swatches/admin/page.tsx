import type { Metadata } from "next";
import DesignEditor from "./design-editor";

export const metadata: Metadata = {
  title: "Swatches 편집",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DesignEditor />;
}
