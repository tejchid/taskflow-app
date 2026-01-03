import { useEffect, useState } from "react"
import { API_BASE } from "./config"

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgs, setOrgs] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [tasks, setTasks] = useState([])
  const [taskTitle, setTaskTitle] = useState("")
  const [metrics, setMetrics] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)

  async function login() {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem("token", data.access_token)
      setToken(data.access_token)
    }
  }

  async function loadOrgs() {
    const res = await fetch(`${API_BASE}/orgs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setOrgs(data)
    if (data.length > 0) setSelectedOrg(data[0].id)
  }

  async function loadTasks() {
    if (!selectedOrg) return
    const res = await fetch(`${API_BASE}/orgs/${selectedOrg}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setTasks(data)
  }

  async function loadMetrics() {
    const res = await fetch(`${API_BASE}/metrics`)
    const data = await res.json()
    setMetrics(data)
  }

  async function createTask() {
    if (!selectedOrg || !taskTitle) return
    await fetch(`${API_BASE}/orgs/${selectedOrg}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: taskTitle }),
    })
    setTaskTitle("")
    loadTasks()
    loadMetrics()
  }

  async function runTask(taskId) {
    await fetch(`${API_BASE}/tasks/${taskId}/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    loadTasks()
  }

  async function viewTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setSelectedTask(data)
  }

  useEffect(() => {
    if (token) {
      loadOrgs()
      loadMetrics()
    }
  }, [token])

  useEffect(() => {
    if (selectedOrg) {
      loadTasks()
      const id = setInterval(() => {
        loadTasks()
        loadMetrics()
      }, 3000)
      return () => clearInterval(id)
    }
  }, [selectedOrg])

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm w-96">
          <h1 className="text-2xl font-bold mb-6">AsyncFlow Login</h1>
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  const totalTasks = metrics?.tasks?.total || 0
  const doneTasks = metrics?.tasks?.done || 0
  const failedTasks = metrics?.tasks?.failed || 0
  const successRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-blue-600 text-white p-6">
        <h1 className="text-xl font-semibold mb-8">AsyncFlow</h1>
        <nav className="space-y-4">
          <div className="font-semibold">Organizations</div>
          {orgs.map((org) => (
            <div
              key={org.id}
              onClick={() => setSelectedOrg(org.id)}
              className={`cursor-pointer p-2 rounded ${
                selectedOrg === org.id ? "bg-blue-700" : "hover:bg-blue-700"
              }`}
            >
              {org.name}
            </div>
          ))}
        </nav>
        <button
          onClick={() => {
            localStorage.removeItem("token")
            setToken("")
          }}
          className="mt-8 text-sm opacity-75 hover:opacity-100"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 space-y-8">
        {/* Metrics Dashboard */}
        {metrics && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-slate-500 text-sm">Total Tasks</div>
              <div className="text-3xl font-bold mt-2">{totalTasks}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-slate-500 text-sm">Completed</div>
              <div className="text-3xl font-bold mt-2 text-green-600">{doneTasks}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-slate-500 text-sm">Failed</div>
              <div className="text-3xl font-bold mt-2 text-red-600">{failedTasks}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-slate-500 text-sm">Success Rate</div>
              <div className="text-3xl font-bold mt-2 text-blue-600">{successRate}%</div>
            </div>
          </div>
        )}

        {/* Create Task */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Create Task</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Task title"
              className="flex-1 px-4 py-2 border rounded"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <button
              onClick={createTask}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Tasks</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2">ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-3">{t.id}</td>
                  <td>{t.title}</td>
                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        t.status === "done"
                          ? "bg-green-100 text-green-700"
                          : t.status === "running"
                          ? "bg-yellow-100 text-yellow-700"
                          : t.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : t.status === "queued"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td className="space-x-2">
                    {t.status === "created" && (
                      <button
                        onClick={() => runTask(t.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Run
                      </button>
                    )}
                    {(t.status === "done" || t.status === "failed") && (
                      <button
                        onClick={() => viewTask(t.id)}
                        className="text-slate-600 hover:underline"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Task Result Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                <div className="text-slate-500 mt-1">Task #{selectedTask.id}</div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-500">Status</div>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${
                    selectedTask.status === "done"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedTask.status}
                </span>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-500">Result</div>
                <div className="mt-1 p-4 bg-slate-50 rounded border">
                  {selectedTask.result || "No result available"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-500">Created</div>
                  <div className="mt-1">{new Date(selectedTask.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500">Updated</div>
                  <div className="mt-1">{new Date(selectedTask.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="mt-6 w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}