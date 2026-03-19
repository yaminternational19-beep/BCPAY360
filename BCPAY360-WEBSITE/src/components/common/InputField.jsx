import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useState } from "react";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const InputField = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
}) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize: typography.size.sm,
          color: colors.textMain,
          fontFamily: typography.fontFamily,
        }}
      >
        {label}
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center", // ensures vertical alignment
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "10px 12px",
          backgroundColor: colors.surface,
        }}
      >
        {/* Left Icon (Email/Lock) */}
        {Icon && (
          <Icon
            size={18}               // same size for all left icons
            style={{ marginRight: "8px", color: colors.black }}
          />
        )}

        {/* Input */}
        <input
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            fontSize: typography.size.md,
            fontFamily: typography.fontFamily,
            backgroundColor: "transparent",
          }}
        />

        {/* Eye Icon for password */}
        {isPassword && (
          <span
            onClick={() => setShow(!show)}
            style={{ cursor: "pointer", color: colors.black }}
          >
            {show ? (
              <MdVisibility size={18} />   // same size as lock icon
            ) : (
              <MdVisibilityOff size={18} />      // same size as lock icon
            )}
          </span>
        )}
      </div>

      {error && (
        <span
          style={{
            color: colors.error,
            fontSize: typography.size.xs,
            fontFamily: typography.fontFamily,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
