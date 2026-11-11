import { useEffect } from 'react'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === 'Learnstash' ? title : `${title} · Learnstash`
  }, [title])
}
