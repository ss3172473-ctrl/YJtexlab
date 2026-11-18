import { businessContact } from "@/lib/business-contact";

export default function BusinessIdentity() {
  return (
    <address className="space-y-1.5 text-sm not-italic leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
      <p className="font-medium text-gray-900">{businessContact.name}</p>
      <p>{businessContact.representative}</p>
      <p><a href={`mailto:${businessContact.email}`} className="hover:text-black">{businessContact.email}</a></p>
      <p><a href={businessContact.telephoneHref} className="hover:text-black">{businessContact.phone}</a></p>
      <p><a href={businessContact.mapHref} target="_blank" rel="noreferrer" className="hover:text-black">{businessContact.address}</a></p>
    </address>
  );
}
