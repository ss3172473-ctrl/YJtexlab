"use client";

import { useState } from "react";

type ContactInquiryFormProps = {
  ctaLabel: string;
};

export default function ContactInquiryForm({
  ctaLabel,
}: ContactInquiryFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form?.reportValidity()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      setStatusTone(null);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          replyTo,
          subject,
          message,
        }),
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error || "문의 전송에 실패했습니다.");
      }

      setStatusTone("success");
      setStatusMessage("문의가 접수되었습니다. 확인 후 회신드리겠습니다.");
      setCompanyName("");
      setReplyTo("");
      setSubject("");
      setMessage("");
      form.reset();
    } catch (error) {
      setStatusTone("error");
      setStatusMessage(
        error instanceof Error ? error.message : "문의 전송에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="contact-company-name"
            className="font-sans text-[11px] uppercase tracking-[0.28em] text-black/45"
          >
            Company / Name
          </label>
          <input
            id="contact-company-name"
            type="text"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="기업명과 성함(직함)을 입력해주세요."
            required
            className="w-full border-b border-black/15 bg-transparent px-0 pb-2 pt-1 font-sans text-[15px] text-black outline-none transition-colors placeholder:text-black/28 focus:border-black"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="contact-email"
            className="font-sans text-[11px] uppercase tracking-[0.28em] text-black/45"
          >
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={replyTo}
            onChange={(event) => setReplyTo(event.target.value)}
            placeholder="회신 받을 이메일을 입력해주세요."
            required
            className="w-full border-b border-black/15 bg-transparent px-0 pb-2 pt-1 font-sans text-[15px] text-black outline-none transition-colors placeholder:text-black/28 focus:border-black"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="contact-subject"
          className="font-sans text-[11px] uppercase tracking-[0.28em] text-black/45"
        >
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="문의 사유를 입력해주세요."
          required
          className="w-full border-b border-black/15 bg-transparent px-0 pb-2 pt-1 font-sans text-[15px] text-black outline-none transition-colors placeholder:text-black/28 focus:border-black"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="contact-message"
          className="font-sans text-[11px] uppercase tracking-[0.28em] text-black/45"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="문의 내용을 입력해주세요."
          required
          rows={5}
          className="min-h-32 w-full resize-none border border-black/10 bg-white/80 px-4 py-3 font-sans text-[15px] leading-6 text-black outline-none transition-colors placeholder:text-black/28 focus:border-black md:min-h-36"
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-black/10 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-between border border-black bg-black px-5 py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-black/10 disabled:text-black/35"
        >
          <span>{isSubmitting ? "Sending..." : ctaLabel}</span>
          <span className="text-base leading-none">↗</span>
        </button>

        {statusMessage ? (
          <p
            className={[
              "max-w-[34rem] font-sans text-sm leading-6",
              statusTone === "success" ? "text-black/62" : "text-red-600",
            ].join(" ")}
          >
            {statusMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
