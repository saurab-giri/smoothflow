import * as React from "react";

export const LemonSqueezy = ({
  productUrl,
  onSuccess,
}: {
  productUrl: string;
  onSuccess: (data: { licenseKey?: string }) => void;
}) => {
  const simulate = () => onSuccess({ licenseKey: "" });
  return (
    <button
      style={{
        padding: "8px 12px",
        background: "#4f46e5",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        marginTop: "8px",
      }}
      onClick={simulate}
    >
      Mock Checkout (dev only)
    </button>
  );
};
