import React, { useState, useEffect } from "react";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";
import "../styles/UserProfile.css";
import { FaCamera, FaSave, FaLock } from "react-icons/fa";
import logoPlaceholder from "../assets/Logo.png";

const UserProfile = () => {
    const { success, error } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        company_name: "",
        email: "",
        timezone: "Asia/Kolkata",
        logo_url: ""
    });

    const [password, setPassword] = useState({
        current: "",
        newPassword: "",
        confirm: ""
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api("/api/admin/company-profile/profile");
            if (res.success) {
                setProfile({
                    company_name: res.data.company_name,
                    email: res.data.email,
                    timezone: res.data.timezone,
                    logo_url: res.data.logo_url
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPassword({ ...password, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const updateProfile = async () => {
        try {
            const res = await api("/api/admin/company-profile/profile", {
                method: "PUT",
                body: {
                    company_name: profile.company_name,
                    email: profile.email,
                    timezone: profile.timezone
                }
            });

            if (res.success) {
                success("Profile updated successfully");
            } else {
                error(res.message || "Failed to update profile");
            }
        } catch (err) {
            error("Failed to update profile");
        }
    };

    const updateLogo = async () => {
        if (!logoFile) return;

        const formData = new FormData();
        formData.append("logo", logoFile);

        try {
            const res = await api("/api/admin/company-profile/logo", {
                method: "POST",
                body: formData,
                isFormData: true
            });

            if (res.success) {
                setProfile(prev => ({ ...prev, logo_url: res.logo_url }));
                setLogoFile(null);
                setLogoPreview(null);
                success("Logo updated successfully");
            } else {
                error(res.message || "Failed to update logo");
            }
        } catch (err) {
            error("Failed to update logo");
        }
    };

    const updatePassword = async () => {
        if (password.newPassword !== password.confirm) {
            error("Passwords do not match");
            return;
        }

        try {
            const res = await api("/api/admin/company-profile/password", {
                method: "PUT",
                body: {
                    currentPassword: password.current,
                    newPassword: password.newPassword
                }
            });

            if (res.success) {
                success("Password updated successfully");
                setPassword({ current: "", newPassword: "", confirm: "" });
            } else {
                error(res.message || "Failed to update password");
            }
        } catch (err) {
            error("Failed to update password");
        }
    };

    if (loading) return <div className="profile-loading">Loading profile...</div>;

    return (
        <div className="profile-container">
            <header className="profile-header">
                <h1>Company Admin Profile</h1>
                <p>Manage your company information and security settings</p>
            </header>

            <div className="profile-grid">
                {/* LOGO SECTION */}
                <div className="profile-card logo-card">
                    <h2>Company Logo</h2>
                    <div className="logo-upload-container">
                        <div className="logo-preview-wrapper">
                            <img 
                                src={logoPreview || profile.logo_url || logoPlaceholder} 
                                alt="Company Logo" 
                                className="logo-preview-img"
                            />
                            <label htmlFor="logo-input" className="logo-edit-btn">
                                <FaCamera />
                                <input 
                                    id="logo-input" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoChange} 
                                    style={{ display: "none" }} 
                                />
                            </label>
                        </div>
                        {logoFile && (
                            <button className="primary-btn logo-save-btn" onClick={updateLogo}>
                                <FaSave /> Save New Logo
                            </button>
                        )}
                    </div>
                </div>

                {/* COMPANY INFO */}
                <div className="profile-card info-card">
                    <h2>General Information</h2>
                    <div className="form-group">
                        <label>Company Name</label>
                        <input
                            type="text"
                            name="company_name"
                            value={profile.company_name}
                            onChange={handleProfileChange}
                            placeholder="Enter Company Name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Admin Email</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            placeholder="Enter Admin Email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Timezone</label>
                        <select 
                            name="timezone" 
                            value={profile.timezone} 
                            onChange={handleProfileChange}
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="UTC">UTC</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="America/New_York">America/New_York</option>
                        </select>
                    </div>

                    <button className="primary-btn" onClick={updateProfile}>
                        <FaSave /> Update Basic Info
                    </button>
                </div>

                {/* SECURITY */}
                <div className="profile-card security-card">
                    <h2>Security & Password</h2>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            name="current"
                            value={password.current}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={password.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            name="confirm"
                            value={password.confirm}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                        />
                    </div>

                    <button className="danger-btn" onClick={updatePassword}>
                        <FaLock /> Change Password
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
