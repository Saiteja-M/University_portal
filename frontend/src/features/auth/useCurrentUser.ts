import { useQuery } from '@tanstack/react-query'

import { getCurrentUser } from './user.service'

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    enabled,
    retry: false,
  })
}