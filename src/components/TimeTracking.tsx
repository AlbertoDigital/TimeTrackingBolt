import React, { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, parseISO, addHours, setHours, setMinutes } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  client: string
}

interface Task {
  id: string
  name: string
  project_id: string
}

interface TimeEntry {
  id: string
  project_id: string
  task_id: string | null
  date: string
  start_time: string
  end_time: string
  hours: number
  description: string
  project?: Project
  task?: Task
}

export const TimeTracking: React.FC = () => {
  const { user } = useAuth()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState<{
    date: string
    project_id: string
    task_id: string
    start_time: string
    end_time: string
    description: string
  } | null>(null)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    fetchData()
  }, [currentWeek, user])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      if (projectsError) throw projectsError
      setProjects(projectsData || [])

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('name')

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Fetch time entries for current week
      const { data: entriesData, error: entriesError } = await supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(*),
          task:tasks(*)
        `)
        .eq('user_id', user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date')
        .order('start_time')

      if (entriesError) throw entriesError
      setTimeEntries(entriesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const calculateHours = (startTime: string, endTime: string): number => {
    const start = parseISO(`2000-01-01T${startTime}:00`)
    const end = parseISO(`2000-01-01T${endTime}:00`)
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }

  const saveTimeEntry = async (entry: Partial<TimeEntry>) => {
    if (!user) return

    try {
      const hours = calculateHours(entry.start_time!, entry.end_time!)
      
      if (entry.id) {
        // Update existing entry
        const { error } = await supabase
          .from('time_entries')
          .update({
            project_id: entry.project_id,
            task_id: entry.task_id || null,
            start_time: entry.start_time,
            end_time: entry.end_time,
            hours,
            description: entry.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.id)

        if (error) throw error
        toast.success('Time entry updated')
      } else {
        // Create new entry
        const { error } = await supabase
          .from('time_entries')
          .insert({
            user_id: user.id,
            project_id: entry.project_id!,
            task_id: entry.task_id || null,
            date: entry.date!,
            start_time: entry.start_time!,
            end_time: entry.end_time!,
            hours,
            description: entry.description || ''
          })

        if (error) throw error
        toast.success('Time entry added')
      }

      setEditingEntry(null)
      setNewEntry(null)
      fetchData()
    } catch (error) {
      console.error('Error saving time entry:', error)
      toast.error('Failed to save time entry')
    }
  }

  const deleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Time entry deleted')
      fetchData()
    } catch (error) {
      console.error('Error deleting time entry:', error)
      toast.error('Failed to delete time entry')
    }
  }

  const getEntriesForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return timeEntries.filter(entry => entry.date === dateStr)
  }

  const getTotalHoursForDay = (date: Date) => {
    return getEntriesForDay(date).reduce((total, entry) => total + entry.hours, 0)
  }

  const startNewEntry = (date: Date) => {
    setNewEntry({
      date: format(date, 'yyyy-MM-dd'),
      project_id: '',
      task_id: '',
      start_time: '09:00',
      end_time: '10:00',
      description: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600">Track your time across projects and tasks</p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-4 text-center border-r border-gray-200 last:border-r-0">
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-semibold text-gray-700 mt-1">
                {format(day, 'd')}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {getTotalHoursForDay(day).toFixed(1)}h
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 min-h-[400px]">
          {weekDays.map((day) => {
            const entries = getEntriesForDay(day)
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            return (
              <div key={day.toISOString()} className={`p-2 border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-blue-50/50' : ''}`}>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <TimeEntryCard
                      key={entry.id}
                      entry={entry}
                      projects={projects}
                      tasks={tasks}
                      isEditing={editingEntry === entry.id}
                      onEdit={() => setEditingEntry(entry.id)}
                      onSave={saveTimeEntry}
                      onCancel={() => setEditingEntry(null)}
                      onDelete={() => deleteTimeEntry(entry.id)}
                    />
                  ))}

                  {newEntry && newEntry.date === format(day, 'yyyy-MM-dd') && (
                    <NewEntryForm
                      entry={newEntry}
                      projects={projects}
                      tasks={tasks}
                      onChange={setNewEntry}
                      onSave={saveTimeEntry}
                      onCancel={() => setNewEntry(null)}
                    />
                  )}

                  <button
                    onClick={() => startNewEntry(day)}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface TimeEntryCardProps {
  entry: TimeEntry
  projects: Project[]
  tasks: Task[]
  isEditing: boolean
  onEdit: () => void
  onSave: (entry: Partial<TimeEntry>) => void
  onCancel: () => void
  onDelete: () => void
}

const TimeEntryCard: React.FC<TimeEntryCardProps> = ({
  entry,
  projects,
  tasks,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    project_id: entry.project_id,
    task_id: entry.task_id || '',
    start_time: entry.start_time,
    end_time: entry.end_time,
    description: entry.description
  })

  const projectTasks = tasks.filter(task => task.project_id === formData.project_id)

  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <select
          value={formData.project_id}
          onChange={(e) => setFormData({ ...formData, project_id: e.target.value, task_id: '' })}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1"
        >
          <option value="">Select Project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name} - {project.client}
            </option>
          ))}
        </select>

        {projectTasks.length > 0 && (
          <select
            value={formData.task_id}
            onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
          >
            <option value="">No Task</option>
            {projectTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex space-x-1">
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
          />
          <input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>

        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description..."
          className="w-full text-xs border border-gray-200 rounded px-2 py-1"
        />

        <div className="flex justify-end space-x-1">
          <button
            onClick={() => onSave({ ...entry, ...formData })}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
          >
            <Save className="w-3 h-3" />
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:bg-gray-50 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">
            {entry.project?.name}
          </div>
          {entry.task && (
            <div className="text-xs text-gray-500 truncate">
              {entry.task.name}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {entry.start_time} - {entry.end_time}
          </div>
          <div className="text-xs font-medium text-blue-600">
            {entry.hours.toFixed(1)}h
          </div>
          {entry.description && (
            <div className="text-xs text-gray-400 mt-1 truncate">
              {entry.description}
            </div>
          )}
        </div>
        <div className="flex space-x-1 ml-2">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface NewEntryFormProps {
  entry: {
    date: string
    project_id: string
    task_id: string
    start_time: string
    end_time: string
    description: string
  }
  projects: Project[]
  tasks: Task[]
  onChange: (entry: any) => void
  onSave: (entry: any) => void
  onCancel: () => void
}

const NewEntryForm: React.FC<NewEntryFormProps> = ({
  entry,
  projects,
  tasks,
  onChange,
  onSave,
  onCancel
}) => {
  const projectTasks = tasks.filter(task => task.project_id === entry.project_id)

  return (
    <div className="bg-blue-50 rounded-lg p-3 space-y-2 border-2 border-blue-200">
      <select
        value={entry.project_id}
        onChange={(e) => onChange({ ...entry, project_id: e.target.value, task_id: '' })}
        className="w-full text-xs border border-gray-200 rounded px-2 py-1"
      >
        <option value="">Select Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>
            {project.name} - {project.client}
          </option>
        ))}
      </select>

      {projectTasks.length > 0 && (
        <select
          value={entry.task_id}
          onChange={(e) => onChange({ ...entry, task_id: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1"
        >
          <option value="">No Task</option>
          {projectTasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex space-x-1">
        <input
          type="time"
          value={entry.start_time}
          onChange={(e) => onChange({ ...entry, start_time: e.target.value })}
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
        />
        <input
          type="time"
          value={entry.end_time}
          onChange={(e) => onChange({ ...entry, end_time: e.target.value })}
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
        />
      </div>

      <input
        type="text"
        value={entry.description}
        onChange={(e) => onChange({ ...entry, description: e.target.value })}
        placeholder="Description..."
        className="w-full text-xs border border-gray-200 rounded px-2 py-1"
      />

      <div className="flex justify-end space-x-1">
        <button
          onClick={() => onSave(entry)}
          disabled={!entry.project_id}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
        >
          <Save className="w-3 h-3" />
        </button>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:bg-gray-50 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}