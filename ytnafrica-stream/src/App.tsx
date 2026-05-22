import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Layouts
import { MainLayout } from "@/components/layout/MainLayout";
import AdminLayout from "@/pages/admin/AdminLayout";

// Main Pages
import Index from "./pages/Index";
import Songs from "./pages/Songs";
import Albums from "./pages/Albums";
import AlbumDetail from "./pages/AlbumDetail";
import Search from "./pages/Search";
import Library from "./pages/Library";
import LikedSongs from "./pages/LikedSongs";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSongs from "./pages/admin/AdminSongs";
import AdminAlbums from "./pages/admin/AdminAlbums";
import AdminArtists from "./pages/admin/AdminArtists";
import ArtistLogin from "./pages/artist/ArtistLogin";
import ArtistLayout from "./pages/artist/ArtistLayout";
import ArtistDashboard from "./pages/artist/ArtistDashboard";
import ArtistSongs from "./pages/artist/ArtistSongs";
import ArtistAlbums from "./pages/artist/ArtistAlbums";
import Artists from "./pages/Artists";
import ArtistProfile from "./pages/ArtistProfile";
import AdminStatistics from "./pages/admin/AdminStatistics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PlayerProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Main Site Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/songs" element={<Songs />} />
                <Route path="/albums" element={<Albums />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/album/:id" element={<AlbumDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/liked" element={<LikedSongs />} />
                <Route path="/artists/:id" element={<ArtistProfile />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="songs" element={<AdminSongs />} />
                <Route path="albums" element={<AdminAlbums />} />
                <Route path="artists" element={<AdminArtists />} />
                <Route path="statistics" element={<AdminStatistics />} />
              </Route>

              {/* Artist Portal */}
              <Route path="/artist/login" element={<ArtistLogin />} />
              <Route path="/artist" element={<ArtistLayout />}>
                <Route path="dashboard" element={<ArtistDashboard />} />
                <Route path="songs" element={<ArtistSongs />} />
                <Route path="albums" element={<ArtistAlbums />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PlayerProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
