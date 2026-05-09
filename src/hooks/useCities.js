import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { CITIES } from '../data/cities'

export function useCities() {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCities() {
      const { data, error } = await supabase.from('cities').select('*').order('id')

      if (!error && data && data.length > 0) {
        setCities(data)
      } else {
        // Fallback to static data if Supabase is not configured yet
        setCities(CITIES.map((c, i) => ({ ...c, id: i + 1 })))
      }
      setLoading(false)
    }

    loadCities()
  }, [])

  return { cities, loading }
}
