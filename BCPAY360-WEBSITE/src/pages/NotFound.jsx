import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.code}>404</h1>
      <h2 style={styles.title}>Page Not Found</h2>
      <p style={styles.text}>
        The page you’re looking for doesn’t exist or was moved.
      </p>

      <button style={styles.button} onClick={() => navigate("/dashboard")}>
        Go to Dashboard
      </button>
    </div>
  );
};

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    background: "#f8fafc",
    fontFamily: "sans-serif",
  },
  code: {
    fontSize: "96px",
    margin: 0,
    color: "#ef4444",
  },
  title: {
    fontSize: "28px",
    margin: "10px 0",
  },
  text: {
    fontSize: "16px",
    color: "#64748b",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
  },
};

export default NotFound;
