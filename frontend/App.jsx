import { useState, useEffect, useRef } from "react";
import Onboarding from "./components/Onboarding.jsx";
import RoadmapView from "./components/RoadmapView.jsx";

function useCountUp(end, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = null;
          function step(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return [value, ref];
}

function Typewriter({ text, speed = 40 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className="typewriter">
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </span>
  );
}

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function ScrollReveal({ children, className = "", delay = 0 }) {
  const ref = useScrollReveal();
  const delayClass = delay > 0 ? ` reveal-delay-${delay}` : "";
  return (
    <div ref={ref} className={`reveal${delayClass} ${className}`}>
      {children}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("pathforge-theme") || "light");
  const [loading, setLoading] = useState(true);

  const [companyStat, companyRef] = useCountUp(30);
  const [trackStat, trackRef] = useCountUp(5);
  const [branchStat, branchRef] = useCountUp(16);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pathforge-theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function handleReset() {
    localStorage.removeItem("userId");
    window.location.hash = "";
    setUser(null);
  }

  return (
    <div className="app-shell">
      {loading && (
        <div className="loading-screen">
          <div className="loading-logo">PF</div>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
        </div>
      )}

      {/* Floating gradient orbs */}
      <div className="orb-container">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <span className="brand-mark">PF</span>
            <div className="brand-text">
              <span className="brand-name">Pathforge</span>
              <span className="brand-tagline">Career Roadmap Builder</span>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? "\u{1F319}" : "\u2600\uFE0F"}
            </button>
            {user && (
              <button className="ghost-btn" onClick={handleReset}>
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        {!user ? (
          <>
            <section className="hero">
              {/* Floating particle dots */}
              <div className="hero-particles">
                <div className="hero-particle" />
                <div className="hero-particle" />
                <div className="hero-particle" />
                <div className="hero-particle" />
                <div className="hero-particle" />
                <div className="hero-particle" />
                <div className="hero-particle" />
                <div className="hero-particle" />
              </div>

              <ScrollReveal>
                <p className="eyebrow">Placement Planning, Simplified</p>
              </ScrollReveal>
              <ScrollReveal delay={1}>
                <h1 className="gradient-text">
                  <Typewriter text="Turn your CGPA and goals into a step-by-step placement plan" speed={30} />
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <p className="hero-sub">
                  Get a tailored roadmap of projects, certifications, target companies, and mock
                  interview practice — built around your branch, year, and dream role.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={3}>
                <div className="hero-stats">
                  <div className="hero-stat" ref={companyRef}>
                    <span className="hero-stat-num">{companyStat}+</span>
                    <span className="hero-stat-label">Companies mapped</span>
                  </div>
                  <div className="hero-stat" ref={trackRef}>
                    <span className="hero-stat-num">{trackStat}</span>
                    <span className="hero-stat-label">Career tracks</span>
                  </div>
                  <div className="hero-stat" ref={branchRef}>
                    <span className="hero-stat-num">{branchStat}</span>
                    <span className="hero-stat-label">Branches supported</span>
                  </div>
                </div>
              </ScrollReveal>
            </section>
            <ScrollReveal>
              <Onboarding onComplete={setUser} />
            </ScrollReveal>
          </>
        ) : (
          <RoadmapView user={user} onReset={handleReset} />
        )}
      </main>

      <footer className="site-footer">
        <p>Pathforge - Built to help engineering students plan their placement journey.</p>
        <p className="disclaimer">Estimates are generalized guidance based on typical trends — not a guarantee of outcomes.</p>
      </footer>
    </div>
  );
}
