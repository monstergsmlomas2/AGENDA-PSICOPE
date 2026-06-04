import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
  } = useRegisterSW()

  useEffect(() => {
    if (needRefresh) {
      window.location.reload()
    }
  }, [needRefresh])

  return null
}
