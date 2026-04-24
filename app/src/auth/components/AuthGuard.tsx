import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';
import LoadingState from '../../shared/components/LoadingState';

interface Props {
  children?: ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const location = useLocation();
  const { session, loading } = useAuthSession();

  if (loading) {
    return <LoadingState message="Verificando sesion..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
