'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestDebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to run test' })
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Reservation Test</h1>
      
      <Button 
        onClick={runTest} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Running Tests...' : 'Run Debug Test'}
      </Button>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}