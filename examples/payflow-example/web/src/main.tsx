import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App.tsx";
import { VideoDemo } from "./app/pages/VideoDemo.tsx";
import { Readout } from "./app/pages/Readout.tsx";
import { GithubRepo } from "./app/pages/GithubRepo.tsx";
import { Header } from "./app/components/Header.tsx";
import { Toaster } from "./app/components/ui/sonner.tsx";
import "./styles/index.css";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Toaster position="top-right" />
      <Header />
      {children}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/demo" element={<VideoDemo />} />
        <Route path="/readout" element={<Readout />} />
        <Route path="/github" element={<GithubRepo />} />
      </Routes>
    </Layout>
  </BrowserRouter>
);
