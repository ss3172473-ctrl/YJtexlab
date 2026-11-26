import type { Metadata } from "next";
import CrmAdmin from "./crm-admin";

export const metadata: Metadata = {
  title: "고객 관리 · YJ TexLab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CrmAdmin />;
}
