import type { Metadata } from "next";
import { verifyPaystackAction } from "@/features/subscription/actions";
import { PaymentCallback } from "@/features/subscription/PaymentCallback";

export const metadata: Metadata = {
  title: "Verifying payment",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function PaystackCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { reference, trxref } = await searchParams;
  const ref = reference || trxref || "";
  const verify = verifyPaystackAction.bind(null, ref);

  return <PaymentCallback verify={verify} hasReference={Boolean(ref)} />;
}
