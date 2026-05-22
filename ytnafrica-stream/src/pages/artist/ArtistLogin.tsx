import { Navigate } from 'react-router-dom';

/** Artist sign-in is handled at /admin */
export default function ArtistLogin() {
  return <Navigate to="/admin" replace />;
}
