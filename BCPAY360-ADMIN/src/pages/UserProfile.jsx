import React, { useState, useEffect, useRef } from "react";
import { FaBuilding, FaEnvelope, FaLock, FaCamera, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { getAdminProfile, updateAdminProfile, updateAdminPassword } from "../api/master.api";
import { useToast } from "../context/ToastContext";
import { Loader } from "../modules/module/components";
import "../styles/UserProfile.css";

const UserProfile = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Profile State
    const [profile, setProfile] = useState({
        company_name: "",
        email: "",
        logo_url: null
    });

    // Password State
    const [passwords, setPasswords] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    // Logo Upload
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getAdminProfile();
            if (res.success) {
                setProfile({
                    company_name: res.data.company_name,
                    email: res.data.email,
                    logo_url: res.data.logo_url
                });
                setLogoPreview(res.data.logo_url);
            }
        } catch (err) {
            toast.error("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("company_name", profile.company_name);
            formData.append("email", profile.email);
            if (logoFile) {
                formData.append("logo", logoFile);
            }

            const res = await updateAdminProfile(formData);
            if (res.success) {
                toast.success("Profile updated successfully");
                // Refresh to get new signed URL if logo changed
                if (logoFile) fetchProfile();
            } else {
                toast.error(res.message || "Update failed");
            }
        } catch (err) {
            toast.error("An error occurred during update");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            toast.error("New passwords do not match");
            return;
        }

        setSaving(true);
        try {
            const res = await updateAdminPassword({
                current_password: passwords.current_password,
                new_password: passwords.new_password
            });
            if (res.success) {
                toast.success("Password updated successfully");
                setPasswords({ current_password: "", new_password: "", confirm_password: "" });
            } else {
                toast.error(res.message || "Password update failed");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader overlay />;

    return (
        <div className="profile-page-wrapper">
            <div className="profile-header">
                <div className="header-content">
                    <h1>Company Profile</h1>
                    <p>Manage your company branding and security settings</p>
                </div>
            </div>

            <div className="profile-grid">
                {/* LEFT COLUMN - GENERAL INFO */}
                <div className="profile-section up-card glass-effect">
                    <div className="section-title">
                        <FaBuilding className="title-icon" />
                        <h2>General Settings</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="profile-form">
                        <div className="logo-upload-container">
                            <div className="logo-preview-wrapper" onClick={() => fileInputRef.current.click()}>
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Company Logo" className="logo-img" />
                                ) : (
                                    <div className="logo-placeholder">
                                        <FaCamera />
                                    </div>
                                )}
                                <div className="upload-overlay">
                                    <FaCamera />
                                </div>
                            </div>
                            <input 
                                type="file" 
                                hidden 
                                ref={fileInputRef} 
                                onChange={handleLogoChange}
                                accept="image/*"
                            />
                            <p className="upload-hint">Click to change company logo</p>
                        </div>

                        <div className="input-group">
                            <label><FaBuilding /> Company Name</label>
                            <input
                                type="text"
                                name="company_name"
                                value={profile.company_name}
                                onChange={handleProfileChange}
                                placeholder="Enter company name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label><FaEnvelope /> Admin Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleProfileChange}
                                placeholder="Enter admin email"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="save-btn" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT COLUMN - SECURITY */}
                <div className="profile-section up-card glass-effect">
                    <div className="section-title">
                        <FaLock className="title-icon" />
                        <h2>Security & Privacy</h2>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="profile-form">
                        <div className="input-group">
                            <label><FaLock /> Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                value={passwords.current_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="password-divider" />

                        <div className="input-group">
                            <label><FaLock /> New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={passwords.new_password}
                                onChange={handlePasswordChange}
                                placeholder="New password"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label><FaLock /> Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={passwords.confirm_password}
                                onChange={handlePasswordChange}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="security-btn" disabled={saving}>
                                {saving ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
