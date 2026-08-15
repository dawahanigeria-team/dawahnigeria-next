import type { Metadata } from "next";
import { verifyFlutterwaveAction } from "@/features/subscription/actions";
import { PaymentCallback } from "@/features/subscription/PaymentCallback";

export const metadata: Metadata = {
  title: "Verifying payment",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function FlutterwaveCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ transaction_id?: string; tx_ref?: string; status?: string }>;
}) {
  const { transaction_id } = await searchParams;
  const txId = transaction_id || "";
  const verify = verifyFlutterwaveAction.bind(null, txId);

  return <PaymentCallback verify={verify} hasReference={Boolean(txId)} />;
}
