import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import SeasonDetail from "./pages/SeasonDetail.jsx";
import CurrentSeason from "./pages/CurrentSeason.jsx";
import { SpoilersProvider } from "./context/SpoilersContext.jsx";

export default function App() {
  return (
    <SpoilersProvider defaultHidden={true}>
      <div className="container">
        <header className="header">
          <div className="brand">
            <span className="logo" aria-hidden="true"></span>
            <h1>Survivor Data Dashboard</h1>
          </div>
          <nav className="nav">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/current">Current Season</NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/current" element={<CurrentSeason />} />
          <Route path="/season/:seasonNumber" element={<SeasonDetail />} />
        </Routes>
      </div>
    </SpoilersProvider>
  );
}
