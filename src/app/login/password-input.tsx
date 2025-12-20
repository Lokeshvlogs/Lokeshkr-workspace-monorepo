// app/login/password-input.tsx
"use client";

import { JSX, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput(): JSX.Element {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        name="password"
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        required
        style={{
          width: "100%",
          paddingRight: 40,
          marginBottom: 12,
        }}
      />

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
