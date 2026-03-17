import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getLinkStyle = (path: string) => ({
    fontSize: "14px",
    fontWeight: location.pathname === path ? 600 : 500,
    color: location.pathname === path ? "#ffd84d" : "#9ca3af",
    textDecoration: "none",
    transition: "all 0.2s ease",
  });

  return (
    <header className="main-header" style={headerStyle}>
      {/* LOGO AREA */}
      <div style={{ zIndex: 101 }}>
        <h1 style={logoStyle}>Movie Analytics</h1>
        <p style={subTitleStyle}>Data Pipeline & Insights</p>
      </div>

      {/* HAMBURGER BUTTON (Aparece apenas no Mobile via CSS abaixo) */}
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        style={hamburgerStyle}
      >
        <div
          style={
            isMenuOpen
              ? { ...barStyle, transform: "rotate(45deg) translate(5px, 5px)" }
              : barStyle
          }
        ></div>
        <div style={isMenuOpen ? { ...barStyle, opacity: 0 } : barStyle}></div>
        <div
          style={
            isMenuOpen
              ? {
                  ...barStyle,
                  transform: "rotate(-45deg) translate(7px, -6px)",
                }
              : barStyle
          }
        ></div>
      </button>

      {/* NAV AREA (Mobile Menu controla a classe via state) */}
      <div
        className={`nav-container ${isMenuOpen ? "open" : ""}`}
        style={navContainerStyle}
      >
        <nav style={navStyle}>
          <Link
            to="/"
            style={getLinkStyle("/")}
            onClick={() => setIsMenuOpen(false)}
          >
            Visão Geral
          </Link>
          <Link
            to="/catalog"
            style={getLinkStyle("/catalog")}
            onClick={() => setIsMenuOpen(false)}
          >
            Catálogo
          </Link>
          <Link
            to="/metrics"
            style={getLinkStyle("/metrics")}
            onClick={() => setIsMenuOpen(false)}
          >
            Métricas
          </Link>
          <Link
            to="/pipeline"
            style={getLinkStyle("/pipeline")}
            onClick={() => setIsMenuOpen(false)}
          >
            Pipeline
          </Link>
        </nav>

        <div className="separator" style={separatorStyle}></div>

        <div style={avatarStyle}>V</div>
      </div>

      {/* CSS PARA RESPONSIVIDADE */}
      <style>{`
        .menu-toggle { display: none; }
        
        @media (max-width: 768px) {
          .main-header { padding: 16px 20px !important; }
          .menu-toggle { 
            display: flex !important; 
            flex-direction: column; 
            gap: 5px; 
            background: none; 
            border: none; 
            cursor: pointer; 
            z-index: 101;
          }
          
          .nav-container {
            position: fixed;
            top: 0;
            right: -100%;
            width: 70%;
            height: 100vh;
            background-color: #1b1b1b;
            flex-direction: column !important;
            justify-content: center !important;
            gap: 40px !important;
            transition: 0.3s ease-in-out;
            box-shadow: -10px 0 30px rgba(0,0,0,0.5);
            padding: 40px;
          }

          .nav-container.open {
            right: 0;
          }

          nav {
            flex-direction: column !important;
            align-items: center;
            gap: 30px !important;
          }

          nav a {
            font-size: 18px !important;
          }

          .separator {
            width: 50% !important;
            height: 1px !important;
          }
        }
      `}</style>
    </header>
  );
}

// --- ESTILOS AUXILIARES ---
const headerStyle: React.CSSProperties = {
  backgroundColor: "#1b1b1b",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "16px 40px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
};

const logoStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  color: "#ffd84d",
  fontWeight: 700,
  letterSpacing: "-0.5px",
};

const subTitleStyle = {
  margin: "2px 0 0 0",
  fontSize: "12px",
  color: "#9ca3af",
};

const navContainerStyle: React.CSSProperties = {
  display: "flex",
  gap: "24px",
  alignItems: "center",
};

const navStyle: React.CSSProperties = { display: "flex", gap: "20px" };

const barStyle: React.CSSProperties = {
  width: "25px",
  height: "3px",
  backgroundColor: "#ffd84d",
  transition: "0.3s",
};

const hamburgerStyle: React.CSSProperties = {
  display: "none",
};

const separatorStyle = {
  width: "1px",
  height: "20px",
  backgroundColor: "rgba(255, 255, 255, 0.15)",
};

const avatarStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  backgroundColor: "#ffd84d",
  color: "#1b1b1b",
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow: "0 0 15px rgba(255, 216, 77, 0.2)",
};
