'use client'

import { useEffect, useState } from 'react'

export default function TestApartmentsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/apartments')
      .then(res => res.json())
      .then(result => {
        console.log('Test page - API result:', result)
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        console.error('Test page - Error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Apartments API</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
      
      {data?.success && data?.data?.apartments?.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Apartments Found:</h2>
          {data.data.apartments.map((apt: any) => (
            <div key={apt.id} className="bg-white p-4 rounded shadow mb-2">
              <p><strong>Name:</strong> {apt.name}</p>
              <p><strong>ID:</strong> {apt.id}</p>
              <p><strong>Status:</strong> {apt.status}</p>
              <p><strong>Address:</strong> {apt.address.street}, {apt.address.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}