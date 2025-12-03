class ModernTaskBoard {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentTaskId = null;
        this.filteredTasks = [...this.tasks];
        this.init();
    }

    init() {
        this.renderTasks();
        this.attachEventListeners();
        this.updateTaskCounts();
    }

    attachEventListeners() {
        // 添加任务按钮
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // 列内添加任务按钮
        document.querySelectorAll('.add-task-column').forEach(button => {
            button.addEventListener('click', (e) => {
                const column = e.target.closest('.column');
                const status = column.dataset.status;
                this.openTaskModal(null, status);
            });
        });

        // 模态框关闭按钮
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // 模态框取消按钮
        document.querySelector('.modal-cancel').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // 点击模态框外部关闭
        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('taskModal').classList.contains('show')) {
                this.closeTaskModal();
            }
        });

        // 任务表单提交
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // 删除任务按钮
        document.getElementById('deleteTaskBtn').addEventListener('click', () => {
            if (this.currentTaskId) {
                this.deleteTask(this.currentTaskId);
            }
        });

        // 搜索功能
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterTasks(e.target.value);
        });

        // 拖拽事件
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const tasksContainers = document.querySelectorAll('.sortable-zone');

        tasksContainers.forEach(container => {
            // 允许放置
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                container.classList.add('drag-over');
            });

            container.addEventListener('dragleave', () => {
                container.classList.remove('drag-over');
            });

            // 放置任务
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.classList.remove('drag-over');

                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = container.parentElement.dataset.status;

                this.updateTaskStatus(taskId, newStatus);
            });
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card ${task.priority}`;
        taskElement.draggable = true;
        taskElement.dataset.id = task.id;

        // 设置拖拽事件
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
        });

        // 点击编辑任务
        taskElement.addEventListener('click', () => {
            this.openTaskModal(task);
        });

        // 格式化截止日期
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const formattedDueDate = dueDate ? dueDate.toLocaleDateString('zh-CN') : '';
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';

        // 获取优先级显示文本
        const priorityText = {
            'low': '低',
            'medium': '中',
            'high': '高',
            'urgent': '紧急'
        };

        taskElement.innerHTML = `
            <div class="task-title">
                <span class="priority-indicator priority-${task.priority}"></span>
                ${task.title}
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                <div class="task-assignee">
                    <i class="fas fa-user"></i>
                    ${task.assignee || '未分配'}
                </div>
                <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                    ${formattedDueDate ? `<i class="far fa-calendar"></i> ${formattedDueDate}` : ''}
                </div>
            </div>
        `;

        return taskElement;
    }

    renderTasks() {
        // 清空所有任务容器
        document.querySelectorAll('.tasks-container').forEach(container => {
            container.innerHTML = '';
        });

        // 按状态分类渲染任务
        const tasksByStatus = {
            todo: [],
            inprogress: [],
            review: [],
            done: []
        };

        this.filteredTasks.forEach(task => {
            if (tasksByStatus[task.status]) {
                tasksByStatus[task.status].push(task);
            }
        });

        // 渲染各列任务
        Object.keys(tasksByStatus).forEach(status => {
            const container = document.getElementById(`${status}-tasks`);
            if (tasksByStatus[status].length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>暂无任务</p></div>';
            } else {
                tasksByStatus[status].forEach(task => {
                    container.appendChild(this.createTaskElement(task));
                });
            }
        });

        this.updateTaskCounts();
    }

    updateTaskCounts() {
        const statusCounts = {
            todo: 0,
            inprogress: 0,
            review: 0,
            done: 0
        };

        this.filteredTasks.forEach(task => {
            if (statusCounts.hasOwnProperty(task.status)) {
                statusCounts[task.status]++;
            }
        });

        Object.keys(statusCounts).forEach(status => {
            const countElement = document.querySelector(`[data-status="${status}"] .task-count`);
            if (countElement) {
                countElement.textContent = statusCounts[status];
            }
        });
    }

    filterTasks(searchTerm) {
        if (!searchTerm) {
            this.filteredTasks = [...this.tasks];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredTasks = this.tasks.filter(task =>
                task.title.toLowerCase().includes(term) ||
                (task.description && task.description.toLowerCase().includes(term)) ||
                (task.assignee && task.assignee.toLowerCase().includes(term))
            );
        }
        this.renderTasks();
    }

    openTaskModal(task = null, defaultStatus = 'todo') {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteTaskBtn');

        // 重置表单
        form.reset();
        document.getElementById('taskId').value = '';
        document.getElementById('taskStatus').value = defaultStatus;

        if (task) {
            // 编辑模式
            title.innerHTML = '<i class="fas fa-edit"></i> 编辑任务';
            deleteBtn.style.display = 'inline-flex';

            // 填充表单数据
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskAssignee').value = task.assignee || '';
            document.getElementById('taskPriority').value = task.priority || 'medium';
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('taskStatus').value = task.status || 'todo';

            this.currentTaskId = task.id;
        } else {
            // 新建模式
            title.innerHTML = '<i class="fas fa-plus-circle"></i> 添加新任务';
            deleteBtn.style.display = 'none';
            this.currentTaskId = null;
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('show');
        document.body.style.overflow = 'auto';
        this.currentTaskId = null;
    }

    saveTask() {
        const taskId = document.getElementById('taskId').value;
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            assignee: document.getElementById('taskAssignee').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value,
            status: document.getElementById('taskStatus').value
        };

        if (!taskData.title.trim()) {
            alert('请输入任务标题');
            return;
        }

        if (taskId) {
            // 更新现有任务
            this.updateTask(taskId, taskData);
        } else {
            // 创建新任务
            this.createTask(taskData);
        }

        this.closeTaskModal();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    createTask(taskData) {
        const newTask = {
            id: this.generateId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.filteredTasks = [...this.tasks];
        this.saveToLocalStorage();
        this.renderTasks();
    }

    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...taskData,
                updatedAt: new Date().toISOString()
            };

            this.filteredTasks = this.tasks.filter(task =>
                this.filteredTasks.some(filtered => filtered.id === task.id)
            );

            this.saveToLocalStorage();
            this.renderTasks();
        }
    }

    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();

            this.saveToLocalStorage();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        if (confirm('确定要删除这个任务吗？此操作不可撤销。')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.filteredTasks = this.filteredTasks.filter(task => task.id !== taskId);
            this.saveToLocalStorage();
            this.renderTasks();
            this.closeTaskModal();
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ModernTaskBoard();
});
