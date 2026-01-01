// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.applyTheme(this.currentTheme);
        this.attachEventListeners();
        this.render();
    }

    cacheDOMElements() {
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.taskCount = document.getElementById('taskCount');
        this.errorMessage = document.getElementById('errorMessage');
        this.charCounter = document.getElementById('charCounter');
        this.themeSelect = document.getElementById('themeSelect');
    }

    attachEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.taskInput.addEventListener('input', () => {
            this.updateCharCounter();
            this.clearError();
        });

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        this.themeSelect.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;

        // Validate input
        const validation = this.validateTaskInput(text);
        if (!validation.valid) {
            this.showError(validation.message);
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.updateCharCounter();
        this.taskInput.focus();
        this.render();
    }

    validateTaskInput(text) {
        // Check if empty
        if (!text) {
            return { valid: false, message: 'Please enter a task.' };
        }

        // Check minimum length
        if (text.length < 3) {
            return { valid: false, message: 'Task must be at least 3 characters long.' };
        }

        // Check maximum length
        if (text.length > 200) {
            return { valid: false, message: 'Task cannot exceed 200 characters.' };
        }

        // Check for only whitespace
        if (!/\S/.test(text)) {
            return { valid: false, message: 'Task cannot contain only spaces.' };
        }

        // Check for duplicate tasks
        const isDuplicate = this.tasks.some(task => 
            task.text.toLowerCase() === text.toLowerCase()
        );
        if (isDuplicate) {
            return { valid: false, message: 'This task already exists.' };
        }

        return { valid: true };
    }

    showError(message) {
        this.taskInput.classList.add('error');
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
        this.taskInput.focus();

        // Remove error after 3 seconds
        setTimeout(() => this.clearError(), 3000);
    }

    clearError() {
        this.taskInput.classList.remove('error');
        this.errorMessage.classList.remove('show');
    }

    updateCharCounter() {
        const length = this.taskInput.value.length;
        const maxLength = 200;
        this.charCounter.textContent = `${length} / ${maxLength}`;
        
        this.charCounter.classList.remove('warning', 'error');
        if (length > maxLength * 0.9) {
            this.charCounter.classList.add('error');
        } else if (length > maxLength * 0.75) {
            this.charCounter.classList.add('warning');
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    }

    shareTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const subject = encodeURIComponent('Task: ' + task.text);
        const body = encodeURIComponent(
            `Task Details:\n\n` +
            `Task: ${task.text}\n` +
            `Priority: ${task.priority.toUpperCase()}\n` +
            `Status: ${task.completed ? 'Completed' : 'Active'}\n` +
            `Created: ${new Date(task.createdAt).toLocaleString()}\n\n` +
            `Shared from Task Manager`
        );

        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Update task count
        const activeCount = this.tasks.filter(t => !t.completed).length;
        this.taskCount.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'}`;

        // Show/hide empty state
        if (filteredTasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
            this.emptyState.querySelector('p').textContent = 
                this.currentFilter === 'all' 
                    ? 'No tasks yet. Add one above to get started!' 
                    : `No ${this.currentFilter} tasks.`;
            return;
        }

        this.taskList.style.display = 'block';
        this.emptyState.style.display = 'none';

        // Render tasks
        this.taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');

        // Attach event listeners to task elements
        filteredTasks.forEach(task => {
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            const checkbox = taskElement.querySelector('.task-checkbox');
            const shareBtn = taskElement.querySelector('.share-btn');
            const deleteBtn = taskElement.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            shareBtn.addEventListener('click', () => this.shareTask(task.id));
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        });
    }

    createTaskHTML(task) {
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    aria-label="Mark task ${this.escapeHTML(task.text)} as ${task.completed ? 'incomplete' : 'complete'}"
                    role="checkbox"
                    aria-checked="${task.completed}">
                <div class="task-content">
                    <div class="task-text">${this.escapeHTML(task.text)}</div>
                    <span class="priority-badge priority-${task.priority}" aria-label="${task.priority} priority">${task.priority}</span>
                </div>
                <div class="task-actions" role="group" aria-label="Task actions">
                    <button 
                        class="share-btn"
                        aria-label="Share task ${this.escapeHTML(task.text)} via email"
                        title="Share via email">
                        Share
                    </button>
                    <button 
                        class="delete-btn"
                        aria-label="Delete task ${this.escapeHTML(task.text)}"
                        title="Delete task">
                        Delete
                    </button>
                </div>
            </li>
        `;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    changeTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.themeSelect.value = theme;
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    loadTheme() {
        const theme = localStorage.getItem('theme');
        return theme || 'default';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});