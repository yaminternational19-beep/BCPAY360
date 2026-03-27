import { useState, useRef, useEffect } from "react";
import {
  MdNotifications,
  MdPerson,
  MdLogout,
  MdMenu,
  MdClose,
  MdDoneAll,
  MdNotificationsNone,
  MdCheckCircle,
  MdEvent,
  MdInfo,
  MdWarning,
  MdDeleteSweep
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./Navbar.css";

const Navbar = ({ onOpen, leftPosition, navbarHeight }) => {
  // --- STATES ---
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState({ name: "", designation: "", photo: null });

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // --- TIME FORMATTER ---
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type) => {
    const title = type?.toLowerCase() || "";
    if (title.includes("approved") || title.includes("success")) return <MdCheckCircle size={22} color="#10b981" />; 
    if (title.includes("holiday") || title.includes("event")) return <MdEvent size={22} color="#3b82f6" />; 
    if (title.includes("warning") || title.includes("alert")) return <MdWarning size={22} color="#f59e0b" />; 
    return <MdInfo size={22} color="#6366f1" />; 
  };

  // --- FETCH DATA ---
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.notifications_data || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (error) { console.error("Notif Error:", error); }
  };

  const fetchUserData = async () => {
    try {
      const storedUser = localStorage.getItem("userProfile");
      if (storedUser) setUser(JSON.parse(storedUser));

      const response = await api.get("/profile");
      const empData = response.data?.employee || response.data?.data;

      if (empData) {
        const userData = {
          name: empData.full_name || empData.name || "User",
          designation: empData.designation || "Employee",
          photo: empData.profile_photo_url || null,
          company_logo_url: empData.company_logo_url || null
        };
        setUser(userData);
        localStorage.setItem("userProfile", JSON.stringify(userData));
      }
    } catch (error) { console.error("Profile Error:", error); }
  };

  // --- 🔥 NOTIFICATION ACTIONS API ---
  const markAsRead = async (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await api.patch("/notifications/action", { action: "READ", id }); } catch (e) { fetchNotifications(); }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    const notifToDelete = notifications.find(n => n.id === id);
    setNotifications(notifications.filter(n => n.id !== id));
    if (notifToDelete && notifToDelete.is_read === 0) setUnreadCount(prev => Math.max(0, prev - 1));
    try { await api.patch("/notifications/action", { action: "DELETE", id }); } catch (err) { fetchNotifications(); }
  };

  const markAllRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    try { await api.patch("/notifications/action", { action: "READ_ALL" }); } catch (err) { fetchNotifications(); }
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try { await api.patch("/notifications/action", { action: "DELETE_ALL" }); } catch (err) { fetchNotifications(); }
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchUserData();
    fetchNotifications();

    const handlePhotoUpdate = (e) => setUser(prev => ({ ...prev, photo: e.detail }));
    window.addEventListener("updateNavbarPhoto", handlePhotoUpdate);
    
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("updateNavbarPhoto", handlePhotoUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dynamicStyles = {
    position: "fixed", top: 0, right: 0, left: leftPosition,
    height: navbarHeight, backgroundColor: "#000000",
    borderBottom: "1px solid #333333", zIndex: 1020,
    transition: "left 0.3s ease", display: "flex", 
    alignItems: "center", justifyContent: "space-between", padding: "0 20px"
  };

  return (
    <nav style={dynamicStyles}>
      {/* LEFT: Menu & Welcome */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <MdMenu size={28} color="#fff" onClick={onOpen} style={{ cursor: "pointer" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>
            Welcome, {user.name ? user.name.split(" ")[0] : "Loading..."}
          </span>
          <span style={{ color: "#aaa", fontSize: "10px" }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* RIGHT: Notif & Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        
        {/* 🔥 NOTIFICATIONS DROPDOWN */}
        <div ref={notifRef} style={{ position: "relative" }}>
           <div onClick={() => setNotifOpen(!notifOpen)} style={{ cursor: "pointer", display: "flex", alignItems: "center", position: "relative", padding: "8px" }}>
             <MdNotifications size={24} color="#fff" />
             {unreadCount > 0 && (
               <span style={{
                 position: "absolute", top: "2px", right: "2px", backgroundColor: "#ef4444", color: "#fff",
                 fontSize: "10px", padding: "2px 5px", borderRadius: "10px", fontWeight: "700", border: "2px solid #000"
               }}>
                 {unreadCount > 99 ? '99+' : unreadCount}
               </span>
             )}
           </div>

           {notifOpen && (
             <div style={{
               position: "absolute", top: "100%", right: 0, marginTop: "10px", width: "320px",
               backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
               border: "1px solid #e0e0e0", overflow: "hidden", zIndex: 1000, maxWidth: "90vw"
             }}>
               <div style={{ padding: "12px 16px", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f9f9f9" }}>
                 <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#333" }}>Notifications</h4>
                 {unreadCount > 0 && (
                   <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#0066cc", fontSize: "11px", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                     <MdDoneAll size={14} /> Mark all read
                   </button>
                 )}
               </div>

               <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                 {notifications.length > 0 ? (
                   notifications.map(notif => (
                     <div key={notif.id} onClick={() => { if(notif.is_read === 0) markAsRead(notif.id) }} style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", backgroundColor: notif.is_read === 1 ? "#fff" : "#f0f8ff", display: "flex", gap: "12px", alignItems: "flex-start", cursor: notif.is_read === 0 ? "pointer" : "default" }}>
                       <div style={{ marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                         {getNotifIcon(notif.title)}
                       </div>
                       <div style={{ flex: 1 }}>
                         <p style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: notif.is_read === 1 ? 400 : 700, color: "#333", lineHeight: "1.4" }}>{notif.title}</p>
                         <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#555", lineHeight: "1.3" }}>{notif.message}</p>
                         <span style={{ fontSize: "11px", color: "#888" }}>{timeAgo(notif.created_at)}</span>
                       </div>
                       <button onClick={(e) => deleteNotif(e, notif.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.6, padding: "2px" }}>
                         <MdClose size={14} color="#333" />
                       </button>
                     </div>
                   ))
                 ) : (
                   <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                     <MdNotificationsNone size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                     <p style={{ margin: 0, fontSize: "13px" }}>No new notifications</p>
                   </div>
                 )}
               </div>

               {notifications.length > 0 && (
                 <div style={{ padding: "8px", borderTop: "1px solid #e0e0e0", textAlign: "center", backgroundColor: "#f9f9f9" }}>
                   <button onClick={clearAll} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%" }}>
                     <MdDeleteSweep size={16} /> Clear all
                   </button>
                 </div>
               )}
             </div>
           )}
        </div>

        {/* PROFILE CIRCLE */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ 
              width: "36px", height: "36px", borderRadius: "50%", 
              backgroundColor: "#fff", color: "#000", display: "flex", 
              alignItems: "center", justifyContent: "center", 
              fontWeight: "800", cursor: "pointer", overflow: "hidden",
              border: "2px solid #333"
            }}
          >
            {user.photo ? (
              <img 
                src={user.photo} 
                alt="Profile" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  setUser(prev => ({ ...prev, photo: null })); 
                }}
              />
            ) : (
              <span style={{ fontSize: "16px", textTransform: "uppercase" }}>
                {user.name ? user.name.charAt(0) : "U"}
              </span>
            )}
          </div>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="dropdown-menu" style={{ position: "absolute", top: "110%", right: 0, backgroundColor: "#000", border: "1px solid #333", borderRadius: "8px", width: "180px", overflow: "hidden", zIndex: 1000 }}>
              <div style={{ padding: "12px", borderBottom: "1px solid #333" }}>
                <p style={{ margin: 0, color: "#fff", fontSize: "13px", fontWeight: "700" }}>{user.name || "User"}</p>
                <p style={{ margin: 0, color: "#888", fontSize: "11px" }}>{user.designation}</p>
              </div>
              <div onClick={() => { navigate("/profile"); setProfileOpen(false); }} style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#fff", borderBottom: "1px solid #333" }}>
                <MdPerson size={16} color="#fff" /> Profile
              </div>
              <div onClick={handleLogout} style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#ff4d4d" }}>
                <MdLogout size={16} color="#ff4d4d" /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;