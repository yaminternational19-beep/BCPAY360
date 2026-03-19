import React, { useState } from "react";
import "../styles/UserProfile.css";

const UserProfile = () => {
    const [profile, setProfile] = useState({
        companyName: "Acme Corp",
        adminEmail: "admin@acme.com"
    });

    const [password, setPassword] = useState({
        current: "",
        newPassword: "",
        confirm: ""
    });

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPassword({ ...password, [e.target.name]: e.target.value });
    };

    const updateProfile = () => {
        // API call → update company/admin info
    };

    const updatePassword = () => {
        if (password.newPassword !== password.confirm) {
            alert("Passwords do not match");
            return;
        }
        // API call → update password
    };

    return (
        <div className="profile-container">
            <h1>Company Admin Profile</h1>

            {/* COMPANY INFO */}
            <div className="profile-card">
                <h2>Company Information</h2>

                <label>Company Name</label>
                <input
                    type="text"
                    name="companyName"
                    value={profile.companyName}
                    onChange={handleProfileChange}
                />

                <label>Admin Email</label>
                <input
                    type="email"
                    name="adminEmail"
                    value={profile.adminEmail}
                    onChange={handleProfileChange}
                />

                <button className="primary-btn" onClick={updateProfile}>
                    Update Profile
                </button>
            </div>

            {/* SECURITY */}
            <div className="profile-card">
                <h2>Security</h2>

                <label>Current Password</label>
                <input
                    type="password"
                    name="current"
                    value={password.current}
                    onChange={handlePasswordChange}
                />

                <label>New Password</label>
                <input
                    type="password"
                    name="newPassword"
                    value={password.newPassword}
                    onChange={handlePasswordChange}
                />

                <label>Confirm New Password</label>
                <input
                    type="password"
                    name="confirm"
                    value={password.confirm}
                    onChange={handlePasswordChange}
                />

                <button className="danger-btn" onClick={updatePassword}>
                    Update Password
                </button>
            </div>
        </div>
    );
};

export default UserProfile;
