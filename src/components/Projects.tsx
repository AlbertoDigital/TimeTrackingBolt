import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, FolderOpen, Calendar, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Project {
  id: string
  name: string
  client: string
  description: string
  start_date: string
  created_at: string
}

interface Task {
  id: string
  project_id: string
  name: string
  description: string
  metadata: Record<string, any>
}

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchTasks()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const saveProject = async (projectData: Partial<Project>) => {
    try {
      if (projectData.id) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: projectData.name,
            client: projectData.client,
            description: projectData.description,
            start_date: projectData.start_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectData.id)

        if (error) throw error
        toast.success('Project updated successfully')
      } else {
        // Create new project
        const { error } = await supabase
          .from('projects')
          .insert({
            name: projectData.name!,
            client: projectData.client!,
            description: projectData.description!,
            start_date: projectData.start_date!
          })

        if (error) throw error
        toast.success('Project created successfully')
      }

      setEditingProject(null)
      setShowNewProject(false)
      fetchProjects()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Failed to save project')
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated tasks and time entries.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const saveTask = async (taskData: Partial<Task>) => {
    try {
      if (taskData.id) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({
            name: taskData.name,
            description: taskData.description,
            metadata: taskData.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskData.id)

        if (error) throw error
        toast.success('Task updated successfully')
      } else {
        // Create new task
        const { error } = await supabase
          .from('tasks')
          .insert({
            project_id: taskData.project_id!,
            name: taskData.name!,
            description: taskData.description || '',
            metadata: taskData.metadata || {}
          })

        if (error) throw error
        toast.success('Task created successfully')
      }

      setShowNewTask(false)
      fetchTasks()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Failed to save task')
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task? This will also delete all associated time entries.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Task deleted successfully')
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project_id === projectId)
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
          <h1 className="text-2xl font-bold text-gray-900">Projects & Tasks</h1>
          <p className="text-gray-600">Manage your projects and organize tasks</p>
        </div>

        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {showNewProject && (
        <ProjectForm
          onSave={saveProject}
          onCancel={() => setShowNewProject(false)}
        />
      )}

      <div className="grid gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
            {editingProject === project.id ? (
              <ProjectForm
                project={project}
                onSave={saveProject}
                onCancel={() => setEditingProject(null)}
              />
            ) : (
              <>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{project.client}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mt-2">{project.description}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingProject(project.id)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Tasks</h4>
                    <button
                      onClick={() => {
                        setSelectedProject(project.id)
                        setShowNewTask(true)
                      }}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Task</span>
                    </button>
                  </div>

                  {showNewTask && selectedProject === project.id && (
                    <TaskForm
                      projectId={project.id}
                      onSave={saveTask}
                      onCancel={() => {
                        setShowNewTask(false)
                        setSelectedProject(null)
                      }}
                    />
                  )}

                  <div className="space-y-2">
                    {getProjectTasks(project.id).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">{task.name}</h5>
                          {task.description && (
                            <p className="text-sm text-gray-600">{task.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {getProjectTasks(project.id).length === 0 && (
                      <p className="text-sm text-gray-500 italic">No tasks yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {projects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600">Create your first project to start tracking time</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface ProjectFormProps {
  project?: Project
  onSave: (project: Partial<Project>) => void
  onCancel: () => void
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    client: project?.client || '',
    description: project?.description || '',
    start_date: project?.start_date || format(new Date(), 'yyyy-MM-dd')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.client.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    onSave({
      ...(project ? { id: project.id } : {}),
      ...formData
    })
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Client name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Project description..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{project ? 'Update' : 'Create'} Project</span>
          </button>
        </div>
      </form>
    </div>
  )
}

interface TaskFormProps {
  projectId: string
  task?: Task
  onSave: (task: Partial<Task>) => void
  onCancel: () => void
}

const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    metadata: task?.metadata || {}
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Please enter a task name')
      return
    }

    onSave({
      ...(task ? { id: task.id } : {}),
      project_id: projectId,
      ...formData
    })
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Task name"
            required
          />
        </div>

        <div>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Task description (optional)"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            <Save className="w-3 h-3" />
            <span>{task ? 'Update' : 'Add'} Task</span>
          </button>
        </div>
      </form>
    </div>
  )
}