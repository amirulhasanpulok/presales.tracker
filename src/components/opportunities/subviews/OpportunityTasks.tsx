import React, { useState } from 'react';
import { Opportunity, ActionItem, DealPriority } from '../../../types';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  User, 
  AlertTriangle, 
  Clock, 
  Filter
} from 'lucide-react';
import { PriorityBadge } from '../../common/Badge';

interface OpportunityTasksProps {
  opportunity: Opportunity;
  onUpdateTask?: (taskId: string, isCompleted: boolean) => void;
  onAddTask?: (task: ActionItem) => void;
}

export const OpportunityTasks: React.FC<OpportunityTasksProps> = ({
  opportunity,
  onUpdateTask,
  onAddTask,
}) => {
  const [tasks, setTasks] = useState<ActionItem[]>(opportunity.actionItems);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState(opportunity.leadSolutionArchitect);
  const [newDueDate, setNewDueDate] = useState('2025-04-10');
  const [newPriority, setNewPriority] = useState<DealPriority>('p1_high');
  const [newCategory, setNewCategory] = useState<ActionItem['category']>('Architecture');

  const toggleTask = (taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t);
    setTasks(updated);
    opportunity.actionItems = updated;
    if (onUpdateTask) {
      const task = updated.find(t => t.id === taskId);
      if (task) onUpdateTask(taskId, task.isCompleted);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: ActionItem = {
      id: `task-${Date.now()}`,
      title: newTitle,
      assignedTo: newAssignee,
      assignedToRole: 'Solution Architect',
      dueDate: newDueDate,
      isCompleted: false,
      priority: newPriority,
      category: newCategory
    };

    const updated = [created, ...tasks];
    setTasks(updated);
    opportunity.actionItems = updated;
    if (onAddTask) onAddTask(created);
    setNewTitle('');
    setShowAddModal(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (!showCompleted && t.isCompleted) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const pendingCount = tasks.filter(t => !t.isCompleted).length;
  const completedCount = tasks.filter(t => t.isCompleted).length;

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold uppercase tracking-wider text-gray-700">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="enterprise-select py-1 text-xs"
            >
              <option value="all">All Categories ({tasks.length})</option>
              <option value="Architecture">Architecture</option>
              <option value="Sizing & BOQ">Sizing & BOQ</option>
              <option value="Security / Compliance">Security / Compliance</option>
              <option value="POC Execution">POC Execution</option>
              <option value="Customer Follow-up">Customer Follow-up</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show Completed ({completedCount})
          </label>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add SLA Action Item
        </button>
      </div>

      {/* New Task Inline Form */}
      {showAddModal && (
        <form onSubmit={handleCreateTask} className="bg-white border border-blue-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Create Deal Action Item</h4>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-xs text-gray-500 hover:text-gray-800">&times; Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Action Description</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Conduct Security Architecture deep-dive with CISO team"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Assignee</label>
              <input
                type="text"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ActionItem['category'])}
                className="enterprise-select w-full text-xs"
              >
                <option value="Architecture">Architecture</option>
                <option value="Sizing & BOQ">Sizing & BOQ</option>
                <option value="Security / Compliance">Security / Compliance</option>
                <option value="POC Execution">POC Execution</option>
                <option value="Customer Follow-up">Customer Follow-up</option>
                <option value="Legal / SOW">Legal / SOW</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as DealPriority)}
                className="enterprise-select w-full text-xs"
              >
                <option value="p0_urgent">P0 URGENT (Breach Risk)</option>
                <option value="p1_high">P1 High</option>
                <option value="p2_medium">P2 Medium</option>
                <option value="p3_low">P3 Low</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
              Save Action Item
            </button>
          </div>
        </form>
      )}

      {/* Task List Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">Status</th>
              <th className="py-2.5 px-3">Task / Deliverable</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Assignee</th>
              <th className="py-2.5 px-3">Due Date / SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {filteredTasks.map(task => {
              const isOverdue = !task.isCompleted && new Date(task.dueDate) < new Date();
              return (
                <tr 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${task.isCompleted ? 'bg-gray-50/50 opacity-60' : ''}`}
                >
                  <td className="py-2.5 px-3 text-center" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto inline" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400 mx-auto inline hover:text-blue-600" />
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`font-semibold text-gray-900 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono border border-gray-200">
                      {task.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-900">
                    {task.assignedTo}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={isOverdue ? 'text-red-700 font-bold flex items-center gap-1' : 'text-gray-600'}>
                      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                      {task.dueDate}
                      {isOverdue && <span className="text-[10px] uppercase font-bold">(Overdue)</span>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-500">
            No action items match the selected filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
