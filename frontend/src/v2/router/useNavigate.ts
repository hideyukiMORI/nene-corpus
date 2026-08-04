/**
 * useNavigate — returns a navigate(to) function for imperative navigation.
 *
 * Example:
 *   const navigate = useNavigate();
 *   navigate('/sources');
 */
import { useRouter } from './Router';

export function useNavigate(): (to: string) => void {
  return useRouter().navigate;
}
