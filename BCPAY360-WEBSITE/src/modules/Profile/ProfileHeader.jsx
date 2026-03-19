import React from "react";
import { MdCameraAlt, MdSave, MdCancel, MdEdit, MdLock } from "react-icons/md";

const ProfileHeader = ({ 
  employee, isEditing, profilePhoto, 
  onUpload, onSave, onCancel, 
  onEdit, setEmployee, isDarkTheme 
}) => {
  
  // 🔥 Premium Black & White Theme
  const theme = {
    heroGradient: `linear-gradient(135deg, #3e678e 0%, #3e678e 100%)`, // Sleek Black to Dark Grey
    textWhite: "#ffffff",
    cancelBtn: isDarkTheme ? "#4b5563" : "#6b7280",
    editBtnBg: "rgba(255,255,255,0.15)",
    avatarBg: "#ffffff",
    iconColor: "#000000" // Black color for icons/text on white elements
  };

  const actionBtn = (bg) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    color: theme.textWhite,
    background: bg,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px",
    transition: "all 0.2s ease",
    flex: "1 1 auto", 
    minWidth: "80px",
    maxWidth: "120px" 
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      window.dispatchEvent(new CustomEvent("updateNavbarPhoto", { detail: imageUrl }));
    }
    if (onUpload) {
      onUpload(e);
    }
  };

  return (
    <div style={{ ...styles.heroSection, background: theme.heroGradient }}>
      
      {/* AVATAR */}
      <div style={{ position: "relative" }}>
        <div style={{ ...styles.avatarStyle, backgroundColor: theme.avatarBg, color: theme.iconColor }}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" style={styles.imgStyle} />
          ) : (
            employee.name?.charAt(0)
          )}
        </div>

        <label htmlFor="upload-photo" style={{ ...styles.cameraBtn, background: theme.iconColor }}>
          <MdCameraAlt size={14} color="#fff" />
        </label>
        <input 
          id="upload-photo" 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          style={{ display: "none" }} 
        />
      </div>

      {/* INFO */}
      <div style={{ flex: 1, minWidth: "150px" }}> 
        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <input 
              style={styles.editInputHero} 
              value={employee.name} 
              onChange={(e) => setEmployee({...employee, name: e.target.value})} 
              placeholder="Full Name"
            />
            <div style={styles.readOnlyHero}>
              <MdLock size={12} /> <span style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{employee.email}</span>
            </div>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "18px", margin: 0, color: theme.textWhite, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {employee.name}
            </h1>
            <p style={{ fontSize: "12px", margin: "2px 0", opacity: 0.85, color: theme.textWhite, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {employee.email}
            </p>
            <span style={styles.badgeStyle}>{employee.designation}</span>
          </>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}> 
        {isEditing ? (
          <>
            <button onClick={onSave} style={actionBtn("#10b981")}>
              <MdSave size={14}/> Save
            </button>
            <button onClick={onCancel} style={actionBtn(theme.cancelBtn)}>
              <MdCancel size={14}/> Cancel
            </button>
          </>
        ) : (
          <button onClick={onEdit} style={actionBtn(theme.editBtnBg)}>
            <MdEdit size={14}/> Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  heroSection: { 
    display: "flex",
    flexDirection: "row", 
    flexWrap: "wrap",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    borderRadius: "16px",
    color: "#fff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
  },
  avatarStyle: { 
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold"
  },
  imgStyle: { width: "100%", height: "100%", objectFit: "cover" },
  cameraBtn: { 
    position: "absolute",
    bottom: 0,
    right: 0,
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #fff",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
  },
  badgeStyle: { 
    background: "rgba(255,255,255,0.2)",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "600",
    display: "inline-block",
    marginTop: "4px"
  },
  editInputHero: { 
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "6px",
    padding: "6px 10px",
    color: "#fff",
    outline: "none",
    fontSize: "13px",
    fontWeight: "600",
    width: "100%",
    boxSizing: "border-box"
  },
  readOnlyHero: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "6px 10px",
    color: "rgba(255,255,255,0.8)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    cursor: "not-allowed"
  }
};

export default ProfileHeader;