import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon: Relay mark on a light sheet, matching the Operate shell. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2F5FA",
        }}
      >
        <svg
          width="132"
          height="132"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="20" r="7.5" fill="#2B6FD6" />
          <circle cx="30" cy="20" r="7.5" fill="#2B6FD6" />
          <path
            d="M14.5 16.2 L25.5 23.8"
            stroke="#245DB8"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path
            d="M14.5 23.8 L25.5 16.2"
            stroke="#3F82E0"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.95"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
