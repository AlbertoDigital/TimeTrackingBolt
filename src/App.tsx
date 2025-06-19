import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/AuthForm'
import { Layout } from './components/Layout'
import { TimeTracking } from './components/TimeTracking'
import { Projects } from './components/Projects'

function App() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('timetracking')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster position="top-right" />
      </>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'timetracking':
        return <TimeTracking />
      case 'projects':
        return <Projects />
      case 'analytics':
        return <div className="text-center py-12 text-gray-500">Analytics coming soon...</div>
      case 'management':
        return <div className="text-center py-12 text-gray-500">User Management coming soon...</div>
      default:
        return <TimeTracking />
    }
  }

  return (
    <>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderCurrentView()}
      </Layout>
      <Toaster position="top-right" />
    </>
  )
}

export default App