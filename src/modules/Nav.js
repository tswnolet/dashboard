import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  RiAccountBoxLine,
  RiAddBoxLine,
  RiArrowDropDownLine,
  RiBuildingLine,
  RiDashboardLine,
  RiProfileLine,
  RiSettings3Line,
  RiSuitcaseLine,
  RiLogoutCircleLine,
  RiBillLine,
} from "react-icons/ri";
import { Contact2, Hash, Menu, Search } from "lucide-react";
import { ArrowBack, MoreHorizOutlined, ChangeCircleOutlined } from "@mui/icons-material";
import Logo from "../resources/logo.png";
import "../styles/Nav.css";
import { Theme } from "./Theme";

/* Hook to detect clicks outside a given ref */
function useOutsideClick(ref, callback) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

/* SearchBar Component */
const SearchBar = ({ expanded, setExpanded }) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  return (
    <div
      ref={containerRef}
      className={`search-container ${expanded ? "expanded" : ""}`}
      style={!expanded ? { justifyContent: "center" } : { padding: "0 10px" }}
      onClick={() => setExpanded(true)}
    >
      <Search className="search-icon" size={expanded ? "20" : "25"} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search"
        className="search-input"
        style={{ display: expanded ? "block" : "none" }}
      />
    </div>
  );
};

/* Dropdown Component */
const Dropdown = ({
  label,
  Icon,
  expanded,
  isOpen,
  toggle,
  onItemClick,
  submenuItems,
  activeBase,
  location,
  navigate,
  setLowerOption,
}) => {
  const parentClass =
    location.pathname === activeBase
      ? "active"
      : location.pathname.startsWith(activeBase)
      ? "main-active"
      : "";
  
  const isActive = (route) => location.pathname.startsWith(route);
  
  return (
    <>
      <div className="menu-item-container">
        <div
          className={`menu-item ${parentClass}`}
          onClick={onItemClick}
          style={{ justifyContent: expanded ? "flex-start" : "center" }}
        >
          <Icon size={25} />
          <span style={{ display: expanded ? "block" : "none" }}>{label}</span>
        </div>
        <div className="menu-dropdown">
          <RiArrowDropDownLine
            size={25}
            style={{
              display: expanded ? "block" : "none",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              fill: isOpen ? "var(--fill)" : "var(--text-color)",
            }}
            onClick={toggle}
          />
        </div>
      </div>
      {isOpen && expanded && (
        <div className="submenu">
          {submenuItems.map((item, index) => (
            <div
              key={index}
              className={`submenu-item ${isActive(item.route) ? "active" : ""}`}
              onClick={() => {
                navigate(item.route);
                if (activeBase !== "/dashboard") {
                  setLowerOption(activeBase.substring(1));
                }
              }}
            >
              {item.Icon && <item.Icon size={20} />}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* Main options Component */
const MainOptions = ({
  expanded,
  lowerOption,
  setLowerOption,
  location,
  navigate,
  dropdowns,
  toggleDropdown,
  mainOptionsRef,
  activeRoute,
}) => {
  const isActive = (route) => location.pathname == route;
  
  return (
    <div id="menu-maininfo" ref={mainOptionsRef}>
      {lowerOption ? (
        // If a lower option is active, render a "More" button.
        <div
          className="menu-item"
          style={{ justifyContent: expanded ? "flex-start" : "center" }}
          onClick={() => setLowerOption(null)}
        >
          <MoreHorizOutlined size={25} />
          <span style={{ display: expanded ? "block" : "none" }}>More</span>
        </div>
      ) : (
        <>
          <Dropdown
            label="Dashboard"
            Icon={RiDashboardLine}
            expanded={expanded}
            isOpen={dropdowns.dashboard}
            toggle={() => toggleDropdown("dashboard")}
            onItemClick={() => {
              if (!isActive("/dashboard")) navigate("/dashboard");
            }}
            submenuItems={[
              {
                label: "Weather Events",
                route: "/dashboard/weather",
                onClick: () => {
                  if (!isActive("/dashboard/weather")) navigate("/dashboard/weather");
                },
              },
            ]}
            activeBase="/dashboard"
            location={location}
            navigate={navigate}
            setLowerOption={setLowerOption}
          />
          <div
            className={`menu-item ${isActive("/cases") ? "active" : ""}`}
            style={{ justifyContent: expanded ? "flex-start" : "center" }}
            onClick={() => {
              if (!isActive("/cases")) navigate("/cases");
            }}
          >
            <RiSuitcaseLine size={25} />
            <span style={{ display: expanded ? "block" : "none" }}>
              Case Management
            </span>
          </div>
          <div
            className={`menu-item ${isActive("/intake") ? "active" : ""}`}
            style={{ justifyContent: expanded ? "flex-start" : "center" }}
            onClick={() => {
              if (!isActive("/intake")) navigate("/intake");
            }}
          >
            <RiAddBoxLine size={25} />
            <span style={{ display: expanded ? "block" : "none" }}>
              Intake
            </span>
          </div>
          <div
            className={`menu-item ${isActive("/contacts") ? "active" : ""}`}
            style={{ justifyContent: expanded ? "flex-start" : "center" }}
            onClick={() => {
              if (!isActive("/contacts")) navigate("/contacts");
            }}
          >
            <RiProfileLine size={25} />
            <span style={{ display: expanded ? "block" : "none" }}>
              Contacts
            </span>
          </div>
        </>
      )}
    </div>
  );
};

/* SubInfo Component */
const SubInfo = ({
  expanded,
  location,
  navigate,
  setLowerOption,
  toggleDropdown,
  dropdowns,
  activeRoute,
}) => {
  const isActive = (route) => location.pathname == route;

  return (
    <div id="menu-subinfo">
      <span className="divider horizontal"></span>
      <div
        id="client"
        className={`menu-item ${isActive("/client-portal") ? "active" : ""}`}
        style={{ justifyContent: expanded ? "flex-start" : "center" }}
        onClick={() => {
          if (!isActive("/client-portal")) navigate("/client-portal");
          setLowerOption("client-portal");
        }}
        title="Client Portal"
      >
        <RiAccountBoxLine size={25} />
        <span style={{ display: expanded ? "block" : "none" }}>
          Client Portal
        </span>
      </div>
      <Dropdown
        label="Firm Settings"
        Icon={RiBuildingLine}
        expanded={expanded}
        isOpen={dropdowns["firm-settings"]}
        toggle={() => toggleDropdown("firm-settings")}
        onItemClick={() => {
          if (!isActive("/firm-settings")) navigate("/firm-settings");
          setLowerOption("firm-settings");
        }}
        submenuItems={[
          {
            label: "Auto Tags",
            Icon: Hash,
            route: "/firm-settings/auto-tags",
          },
          {
            label: "Billing",
            Icon: RiBillLine,
            route: "/firm-settings/billing",
          },
          {
            label: "Contacts Setup",
            Icon: Contact2,
            route: "/firm-settings/contacts",
          },
          {
            label: "Layout Editor",
            Icon: ChangeCircleOutlined,
            route: "/firm-settings/layout-editor",
          },
        ]}
        activeBase="/firm-settings"
        location={location}
        navigate={navigate}
        setLowerOption={setLowerOption}
      />
    </div>
  );
};

/* Footer Component */
const Footer = ({ expanded, navigate, logout, theme, changeTheme, location }) => {
  const isActive = (route) => location.pathname.startsWith(route);
  return (
    <div id="menu-footer" style={{ alignItems: expanded ? "flex-start" : "center" }}>
      <div
        className={`menu-item c ${isActive("/settings") ? "active" : ""}`}
        onClick={() => {
          if (!isActive("/settings")) navigate("/settings");
        }}
      >
        <RiSettings3Line size={25} />
        <span style={{ display: expanded ? "block" : "none" }}>Settings</span>
      </div>
      <div className="menu-item c" onClick={logout}>
        <RiLogoutCircleLine size={25} />
        <span style={{ display: expanded ? "block" : "none" }}>Logout</span>
      </div>
      <Theme theme={theme} changeTheme={changeTheme} />
    </div>
  );
};

/* Main Nav Component */
const Nav = ({ theme, changeTheme, logout }) => {
  const [expanded, setExpanded] = useState(false);
  const [dropdowns, setDropdowns] = useState({
    dashboard: false,
    "firm-settings": false,
  });
  const [lowerOption, setLowerOption] = useState(null);
  const [activeRoute, setActiveRoute] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const mainOptionsRef = useRef(null);

  useEffect(() => {
    setActiveRoute(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const updateVh = () => {
      document.documentElement.style.setProperty("--real-vh", `${window.innerHeight}px`);
    };
    updateVh();
    window.addEventListener("resize", updateVh);
    return () => window.removeEventListener("resize", updateVh);
  }, []);

  useEffect(() => {
    document.querySelectorAll(".page-container").forEach((container) => {
      container.style.margin = expanded ? "0 0 0 175px" : "0";
      container.style.transition = "margin 0.3s";
    });
  }, [expanded, location.pathname]);

  const toggleDropdown = (menu) => {
    setDropdowns((prev) => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      newState[menu] = !prev[menu];
      return newState;
    });
  };  

  // Check if the current route starts with one of the lower option bases.
  const isLowerOptionPage = useCallback(() => {
    return (
      location.pathname.startsWith("/client-portal") ||
      location.pathname.startsWith("/firm-settings")
    );
  }, [location.pathname]);

  useEffect(() => {
    if (isLowerOptionPage()) {
      // Set lowerOption to the base of the lower option.
      if (location.pathname.startsWith("/client-portal"))
        setLowerOption("client-portal");
      else if (location.pathname.startsWith("/firm-settings"))
        setLowerOption("firm-settings");
    } else {
      setLowerOption(null);
    }
  }, [location.pathname, isLowerOptionPage]);

  useOutsideClick(mainOptionsRef, () => {
    if (!lowerOption && isLowerOptionPage()) {
      if (location.pathname.startsWith("/client-portal"))
        setLowerOption("client-portal");
      else if (location.pathname.startsWith("/firm-settings"))
        setLowerOption("firm-settings");
    }
  });

  return (
    <nav className={expanded ? "expanded" : ""} style={{ width: expanded ? "250px" : "75px" }}>
      <div id="menu">
        <div id="menu-header" style={{ alignItems: expanded ? "flex-start" : "center" }}>
          <div className="nav-toggle" style={{ justifyContent: expanded ? "space-between" : "center" }}>
            <button onClick={() => setExpanded(!expanded)} className='nav-toggle-button'>
              {expanded ? <ArrowBack size={25} /> : <Menu size={25} />}
            </button>
            <img
              src={Logo}
              id="nav-logo"
              alt="Logo"
              style={{
                display: expanded ? "block" : "none",
                filter: theme === "dark" ? "brightness(1000)" : "brightness(0)",
              }}
            />
          </div>
          <SearchBar expanded={expanded} setExpanded={setExpanded} />
        </div>
        <span className="divider horizontal"></span>
        <div id="menu-navigation" style={lowerOption ? { gap: "15px" } : { justifyContent: "space-between" }}>
          <MainOptions
            expanded={expanded}
            lowerOption={lowerOption}
            setLowerOption={setLowerOption}
            location={location}
            navigate={navigate}
            dropdowns={dropdowns}
            toggleDropdown={toggleDropdown}
            mainOptionsRef={mainOptionsRef}
            activeRoute={activeRoute}
          />
          <SubInfo
            expanded={expanded}
            location={location}
            navigate={navigate}
            setLowerOption={setLowerOption}
            toggleDropdown={toggleDropdown}
            dropdowns={dropdowns}
            activeRoute={activeRoute}
          />
        </div>
      </div>
      <Footer
        expanded={expanded}
        navigate={navigate}
        logout={logout}
        theme={theme}
        changeTheme={changeTheme}
        location={location}
        activeRoute={activeRoute}
      />
    </nav>
  );
};

export default Nav;