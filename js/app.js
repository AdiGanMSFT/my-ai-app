// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.categories = this.loadCategories();
        this.currentFilter = 'all';
        this.currentTheme = this.loadTheme();
        this.suggestionTimeout = null;
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.applyTheme(this.currentTheme);
        this.renderCategoryOptions();
        this.attachEventListeners();
        this.render();
    }

    cacheDOMElements() {
        this.taskInput = document.getElementById('taskInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.categorySuggestions = document.getElementById('categorySuggestions');
        this.newCategoryInput = document.getElementById('newCategoryInput');
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
            
            // Debounce suggestions
            clearTimeout(this.suggestionTimeout);
            this.suggestionTimeout = setTimeout(() => {
                this.suggestCategories();
            }, 300);
        });

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        this.themeSelect.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        this.categorySelect.addEventListener('change', (e) => {
            if (e.target.value === '__new__') {
                this.newCategoryInput.style.display = 'block';
                this.newCategoryInput.focus();
            } else {
                this.newCategoryInput.style.display = 'none';
            }
        });

        this.newCategoryInput.addEventListener('blur', () => {
            if (!this.newCategoryInput.value.trim()) {
                this.categorySelect.value = '';
                this.newCategoryInput.style.display = 'none';
            }
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;
        let category = this.categorySelect.value;

        // Handle new category
        if (category === '__new__') {
            const newCat = this.newCategoryInput.value.trim();
            if (newCat) {
                category = newCat;
                if (!this.categories.includes(category)) {
                    this.categories.push(category);
                    this.saveCategories();
                    this.renderCategoryOptions();
                }
            } else {
                category = '';
            }
        }

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
            category: category || null,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.newCategoryInput.value = '';
        this.newCategoryInput.style.display = 'none';
        this.categorySelect.value = category || '';
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

        // Group tasks by category
        const groupedTasks = this.groupTasksByCategory(filteredTasks);
        
        // Render grouped tasks
        this.taskList.innerHTML = Object.entries(groupedTasks)
            .map(([category, tasks]) => this.createCategoryGroupHTML(category, tasks))
            .join('');

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

        // Attach event listeners to category delete buttons
        Object.keys(groupedTasks).forEach(category => {
            if (category !== 'Uncategorized') {
                const deleteBtn = document.querySelector(`[data-category="${category}"] .delete-category-btn`);
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteCategory(category));
                }
            }
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
                    <div class="task-meta">
                        <span class="priority-badge priority-${task.priority}" aria-label="${task.priority} priority">${task.priority}</span>
                    </div>
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

    groupTasksByCategory(tasks) {
        const groups = {};
        
        tasks.forEach(task => {
            const category = task.category || 'Uncategorized';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(task);
        });

        // Sort categories: Uncategorized last, others alphabetically
        const sorted = {};
        Object.keys(groups)
            .sort((a, b) => {
                if (a === 'Uncategorized') return 1;
                if (b === 'Uncategorized') return -1;
                return a.localeCompare(b);
            })
            .forEach(key => {
                sorted[key] = groups[key];
            });

        return sorted;
    }

    createCategoryGroupHTML(category, tasks) {
        const canDelete = category !== 'Uncategorized';
        return `
            <div class="category-group" data-category="${this.escapeHTML(category)}">
                <div class="category-header">
                    <div class="category-title">
                        ${this.escapeHTML(category)}
                        <span class="category-count">${tasks.length}</span>
                    </div>
                    ${canDelete ? `<button class="delete-category-btn" title="Delete category">Delete Category</button>` : ''}
                </div>
                <ul class="category-tasks">
                    ${tasks.map(task => this.createTaskHTML(task)).join('')}
                </ul>
            </div>
        `;
    }

    renderCategoryOptions() {
        const options = [
            '<option value="">No Category</option>',
            ...this.categories.map(cat => 
                `<option value="${this.escapeHTML(cat)}">${this.escapeHTML(cat)}</option>`
            ),
            '<option value="__new__">+ New Category</option>'
        ];
        this.categorySelect.innerHTML = options.join('');
    }

    deleteCategory(category) {
        if (!confirm(`Delete category "${category}"? Tasks will be uncategorized.`)) {
            return;
        }

        // Remove category from list
        this.categories = this.categories.filter(c => c !== category);
        this.saveCategories();

        // Update tasks in this category
        this.tasks.forEach(task => {
            if (task.category === category) {
                task.category = null;
            }
        });
        this.saveTasks();

        this.renderCategoryOptions();
        this.render();
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    loadCategories() {
        const categories = localStorage.getItem('categories');
        return categories ? JSON.parse(categories) : [];
    }

    suggestCategories() {
        const text = this.taskInput.value.trim().toLowerCase();
        
        // Don't suggest if text is too short or no categories exist
        if (text.length < 3 || this.categories.length === 0) {
            this.categorySuggestions.style.display = 'none';
            return;
        }

        // Build a map of categories with their associated task keywords and frequency
        const categoryData = this.buildCategoryData();
        
        // Extract meaningful words from input
        const inputWords = this.extractKeywords(text);
        
        // Score each category based on multiple factors
        const scores = this.categories.map(category => {
            const data = categoryData[category] || { keywords: {}, taskCount: 0 };
            let score = 0;
            let matches = [];
            
            // 1. Direct category name match (high weight)
            const categoryLower = category.toLowerCase();
            if (text === categoryLower) {
                score += 50;
                matches.push('exact match');
            } else if (text.includes(categoryLower)) {
                score += 30;
                matches.push('contains category');
            } else if (categoryLower.includes(text)) {
                score += 20;
                matches.push('partial category');
            }
            
            // 2. Fuzzy match on category name
            const similarity = this.calculateSimilarity(text, categoryLower);
            if (similarity > 0.6) {
                score += Math.floor(similarity * 15);
                matches.push(`${Math.floor(similarity * 100)}% similar`);
            }
            
            // 3. Keyword frequency matching with TF-IDF-like scoring
            inputWords.forEach(word => {
                if (data.keywords[word]) {
                    // Score based on how unique this keyword is to this category
                    const frequency = data.keywords[word];
                    const uniqueness = this.calculateKeywordUniqueness(word, categoryData);
                    score += frequency * uniqueness * 3;
                    matches.push(word);
                }
            });
            
            // 4. Partial word matching (fuzzy)
            Object.keys(data.keywords).forEach(keyword => {
                inputWords.forEach(inputWord => {
                    if (inputWord.length > 3 && keyword.includes(inputWord)) {
                        score += data.keywords[keyword] * 0.5;
                    }
                });
            });
            
            // 5. Boost score based on category popularity (more tasks = slight boost)
            const popularityBoost = Math.log(data.taskCount + 1) * 0.5;
            score += popularityBoost;
            
            // Calculate confidence percentage
            const confidence = Math.min(100, Math.floor((score / 50) * 100));
            
            return { 
                category, 
                score, 
                confidence,
                matches: [...new Set(matches)].slice(0, 3)
            };
        });
        
        // Get top suggestions (score > 2 to avoid weak matches)
        const suggestions = scores
            .filter(s => s.score > 2)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
        
        if (suggestions.length > 0) {
            this.displaySuggestions(suggestions);
        } else {
            this.categorySuggestions.style.display = 'none';
        }
    }

    buildCategoryData() {
        const data = {};
        
        this.tasks.forEach(task => {
            if (task.category) {
                if (!data[task.category]) {
                    data[task.category] = { keywords: {}, taskCount: 0 };
                }
                
                data[task.category].taskCount++;
                
                // Extract keywords with frequency
                const words = this.extractKeywords(task.text.toLowerCase());
                words.forEach(word => {
                    data[task.category].keywords[word] = 
                        (data[task.category].keywords[word] || 0) + 1;
                });
            }
        });
        
        return data;
    }

    extractKeywords(text) {
        // Enhanced stop words list
        const stopWords = new Set([
            'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'can', 'to', 'for', 'of', 'in',
            'by', 'with', 'from', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again', 'further',
            'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
            'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
            'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'this',
            'that', 'these', 'those', 'what', 'just', 'get', 'need', 'make', 'done'
        ]);
        
        return text
            .split(/[\s,.:;!?()-]+/)
            .map(word => word.replace(/[^a-z0-9]/g, ''))
            .filter(word => word.length > 2)
            .filter(word => !stopWords.has(word));
    }

    calculateSimilarity(str1, str2) {
        // Levenshtein distance-based similarity
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.getEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    getEditDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    calculateKeywordUniqueness(keyword, categoryData) {
        // How many categories have this keyword
        let categoriesWithKeyword = 0;
        Object.values(categoryData).forEach(data => {
            if (data.keywords[keyword]) {
                categoriesWithKeyword++;
            }
        });
        
        // More unique = higher score
        return categoriesWithKeyword === 0 ? 1 : (1 / categoriesWithKeyword);
    }

    displaySuggestions(suggestions) {
        const chips = suggestions.map(({ category, confidence, matches }) => {
            const confidenceClass = confidence >= 70 ? 'high-confidence' : 
                                   confidence >= 40 ? 'medium-confidence' : '';
            const emoji = confidence >= 70 ? '⭐' : confidence >= 40 ? '✓' : '';
            const matchInfo = matches.length > 0 ? 
                ` (${matches.slice(0, 2).join(', ')})` : '';
            
            return `<span class="suggestion-chip ${confidenceClass}" 
                          data-category="${this.escapeHTML(category)}"
                          title="Confidence: ${confidence}%${matchInfo}">
                        ${emoji} ${this.escapeHTML(category)}
                        <span class="confidence-indicator">${confidence}%</span>
                    </span>`;
        }).join('');
        
        this.categorySuggestions.innerHTML = `
            <span class="suggestion-label">💡 Suggested categories:</span>
            <div class="suggestion-chips">
                ${chips}
            </div>
        `;
        this.categorySuggestions.style.display = 'block';
        
        // Attach click handlers to chips
        this.categorySuggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const category = chip.dataset.category;
                this.categorySelect.value = category;
                this.categorySuggestions.style.display = 'none';
            });
        });
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