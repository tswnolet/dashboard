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
import { Book, BookMarkedIcon, Cloud, Contact2, FileEditIcon, Hash, Menu, Search } from "lucide-react";
import { ArrowBack, MoreHorizOutlined, ChangeCircleOutlined, CloudDoneOutlined, CloudOutlined, Create, CreateOutlined, Add, AddOutlined, AddCircleOutline, DocumentScannerOutlined } from "@mui/icons-material";
import Logo from "../resources/logo.png";
import "../styles/Nav.css";
import { Theme } from "./Theme";
import { CreateContact } from "./CreateContact";

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
export const SearchBar = ({ placeholder = null, expanded, setExpanded, setSearchQuery, autofocus = false }) => {
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
        name='search-bar'
        placeholder={placeholder || "Search"}
        className="search-input"
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ display: expanded ? "block" : "none" }}
        autoFocus={autofocus}
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
          onClick={() => {
            toggle();
            onItemClick();
          }}
          style={{ justifyContent: expanded ? "flex-start" : "center" }}
          title={label}
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
      {isOpen && (
        <div className='submenu'>
          {submenuItems.map((item, index) => (
            <div
              key={index}
              className={`submenu-item${isActive(item.route) ? " active" : ""}${expanded ? " expanded" : ""}`}
              style={{ justifyContent: expanded ? "flex-start" : "center" }}
              onClick={() => {
                navigate(item.route);
                if (activeBase !== "/dashboard") {
                  setLowerOption(activeBase.substring(1));
                }
              }}
            >
              {item.Icon && <item.Icon size={20} />}
              {expanded && <span>{item.label}</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* Main options Component */
const MainOptions = ({
  accessLevel,
  expanded,
  lowerOption,
  setLowerOption,
  location,
  navigate,
  dropdowns,
  toggleDropdown,
  mainOptionsRef,
  activeRoute,
  openOption,
  setOpenOption,
}) => {
  const isActive = (route) => location.pathname == route;
  
  return (
    <div id="menu-maininfo" ref={mainOptionsRef}>
      {lowerOption || openOption !== 0 ? (
        // If a lower option is active, render a "More" button.
        <div
          className="menu-item"
          style={{ justifyContent: expanded ? "flex-start" : "center" }}
          onClick={() => {setLowerOption(null); setOpenOption(0);}}
          title="More"
        >
          <MoreHorizOutlined size={25} />
          <span style={{ display: expanded ? "block" : "none" }}>More</span>
        </div>
      ) : (
        <>
          {accessLevel === 'global admin' && <Dropdown
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
                Icon: Cloud,
                onClick: () => {
                  if (!isActive("/dashboard/weather")) navigate("/dashboard/weather");
                },
              },
            ]}
            activeBase="/dashboard"
            location={location}
            navigate={navigate}
            setLowerOption={setLowerOption}
          />}
          <div
            className={`menu-item ${isActive("/cases") ? "active" : ""}`}
            style={{ justifyContent: expanded ? "flex-start" : "center" }}
            onClick={() => {
              if (!isActive("/cases")) navigate("/cases");
            }}
            title="Cases"
          >
            <RiSuitcaseLine size={25} />
            <span style={{ display: expanded ? "block" : "none" }}>
              Cases
            </span>
          </div>
          <div
            className={`menu-item ${isActive("/intake") ? "active" : ""}`}
            style={{ justifyContent: expanded ? "flex-start" : "center" }}
            onClick={() => {
              if (!isActive("/intake")) navigate("/intake");
            }}
            title="Intake"
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
            title="Contacts"
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

const SubInfo = ({
  expanded,
  location,
  navigate,
  setLowerOption,
  toggleDropdown,
  dropdowns,
  activeRoute,
  openOption,
  setOpenOption,
}) => {
  const isActive = (route) => location.pathname == route;

  return (
    <div id="menu-subinfo">
      <span className="divider horizontal"></span>
      {openOption === 1 ? (
        <>
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
                label: "Custom Fields",
                Icon: FileEditIcon,
                route: "/firm-settings/custom-fields",
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
          <div 
            id='library' 
            className={`menu-item ${isActive("/library") ? "active" : ""}`} 
            style={{ justifyContent: expanded ? "flex-start" : "center" }} 
            onClick={() => { if (!isActive("/library")) navigate("/library"); setLowerOption("library"); }} 
            title="Case Library"
          >
            <BookMarkedIcon size={25} />
            <span style={{ display: expanded ? "block" : "none" }}>Case Library</span>
          </div>
        </>
      ) : (
        <div
          className="menu-item"
          style={{ justifyContent: expanded ? "flex-start" : "center" }}
          onClick={() => setOpenOption(1)}
          title="More"
        >
          <MoreHorizOutlined size={25} />
          <span style={{ display: expanded ? "block" : "none" }}>More</span>
        </div>
      )}
    </div>
  );
};

/* Footer Component */
const Footer = ({ expanded, navigate, logout, theme, changeTheme, location }) => {
  const [createNew, setCreateNew] = useState(false);
  const createNewRef = useRef(null);

  const isActive = (route) => location.pathname.startsWith(route);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createNewRef.current && !createNewRef.current.contains(e.target)) {
        setCreateNew(false);
      }
    };

    if (createNew) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [createNew]);

  return (
    <div id="menu-footer" style={{ alignItems: expanded ? "flex-start" : "center" }}>
      <div className="create-new-wrapper" ref={createNewRef}>
        <button className="action nav-toggle-button" onClick={() => setCreateNew(!createNew)}>
          <AddCircleOutline />
          <span style={{ display: expanded ? "block" : "none" }}>Create New...</span>
        </button>

        {createNew && (
          <div className="create-new">
            <div className="create-new-item" onClick={() => navigate("/cases?new=true")}>
              <span>Case</span>
            </div>
            <div className="create-new-item" onClick={() => navigate("/intake?new=true")}>
              <span>Lead</span>
            </div>
            <div className="create-new-item" onClick={() => navigate("/contacts?new=true")}>
              <span>Contact</span>
            </div>
          </div>
        )}
      </div>

      <div
        className={`menu-item c ${isActive("/settings") ? "active" : ""}`}
        onClick={() => !isActive("/settings") && navigate("/settings")}
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
const Nav = ({ accessLevel, theme, changeTheme, logout }) => {
  const [expanded, setExpanded] = useState(false);
  const [dropdowns, setDropdowns] = useState({
    dashboard: false,
    "firm-settings": false,
  });
  const [lowerOption, setLowerOption] = useState(null);
  const [activeRoute, setActiveRoute] = useState("");
  const [openOption, setOpenOption] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const mainOptionsRef = useRef(null);
  const [navClass, setNavClass] = useState("");

  useEffect(() => {
    setOpenOption(lowerOption ? 1 : 0);
  }, [lowerOption]);

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
    
    document.querySelectorAll(".case-container").forEach((container) => {
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

  const isLowerOptionPage = useCallback(() => {
    return (
      location.pathname.startsWith("/client-portal") ||
      location.pathname.startsWith("/firm-settings") || 
      location.pathname.startsWith("/library")
    );
  }, [location.pathname]);

  useEffect(() => {
    if (isLowerOptionPage()) {
      if (location.pathname.startsWith("/client-portal")) {
        setLowerOption("client-portal");
      } else if (location.pathname.startsWith("/firm-settings")) {
        setLowerOption("firm-settings");
      } else if (location.pathname.startsWith("/library")) {
        setLowerOption("library");
      } else {
        setLowerOption(null);
      }
    }
  }, [location.pathname, isLowerOptionPage]);

  useOutsideClick(mainOptionsRef, () => {
    if (!lowerOption && isLowerOptionPage()) {
      if (location.pathname.startsWith("/client-portal"))
        setLowerOption("client-portal");
      else if (location.pathname.startsWith("/firm-settings"))
        setLowerOption("firm-settings");
      else if (location.pathname.startsWith("/library"))
        setLowerOption("library");
    }
  });

  return (
    <nav className={`${expanded ? "expanded " : ""}${navClass}`} style={{ width: expanded ? "250px" : "75px" }}>
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
        <div id="menu-navigation" style={lowerOption || openOption === 1 ? { gap: "15px" } : { justifyContent: "space-between" }}>
          <MainOptions
            accessLevel={accessLevel}
            expanded={expanded}
            lowerOption={lowerOption}
            setLowerOption={setLowerOption}
            location={location}
            navigate={navigate}
            dropdowns={dropdowns}
            toggleDropdown={toggleDropdown}
            mainOptionsRef={mainOptionsRef}
            activeRoute={activeRoute}
            openOption={openOption}
            setOpenOption={setOpenOption}
          />
          {(accessLevel === 'global admin' || accessLevel === 'admin') &&
            <SubInfo
              expanded={expanded}
              location={location}
              navigate={navigate}
              setLowerOption={setLowerOption}
              toggleDropdown={toggleDropdown}
              dropdowns={dropdowns}
              activeRoute={activeRoute}
              openOption={openOption}
              setOpenOption={setOpenOption}
            />
          }
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