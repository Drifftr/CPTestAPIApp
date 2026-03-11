import { useAuthContext } from '@asgardeo/auth-react';
import { useMockAuthContext } from './MockAuthProvider';
import env from '../config/env';

const useAuth = env.DEV_BYPASS_AUTH ? useMockAuthContext : useAuthContext;

export default useAuth;
