export type ContactSubmission = {
  companyName: string;
  replyTo: string;
  subject: string;
  message: string;
};

type NormalizedContactSubmission = ReturnType<typeof normalizeContactSubmission>;

function normalizeLine(value: string) {
  return value.trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeContactSubmission({
  companyName,
  replyTo,
  subject,
  message,
}: ContactSubmission) {
  const normalizedCompany = normalizeLine(companyName);
  const normalizedReplyTo = normalizeLine(replyTo);
  const normalizedSubject = normalizeLine(subject);
  const normalizedMessage = normalizeLine(message);

  if (!normalizedCompany || !normalizedReplyTo || !normalizedSubject || !normalizedMessage) {
    throw new Error("All fields are required.");
  }

  if (!isValidEmail(normalizedReplyTo)) {
    throw new Error("A valid reply-to email is required.");
  }

  return {
    companyName: normalizedCompany.slice(0, 160),
    replyTo: normalizedReplyTo.slice(0, 160),
    subject: normalizedSubject.slice(0, 200),
    message: normalizedMessage.slice(0, 5000),
  };
}

export function formatContactTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function buildContactSheetRow(
  payload: NormalizedContactSubmission,
  source = "website/contact",
) {
  return [
    formatContactTimestamp(),
    payload.companyName,
    payload.replyTo,
    payload.subject,
    payload.message,
    source,
  ];
}
