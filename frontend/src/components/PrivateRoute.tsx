import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    
    return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

export default PrivateRoute; 