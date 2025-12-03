// 添加新任务
function addTask() {
    const input = document.getElementById('taskInput');
    const taskText = input.value.trim();
    if (!taskText) return;

    const task = createTaskElement(taskText);
    document.getElementById('todo').appendChild(task);
    input.value = '';
}

// 创建任务元素
function createTaskElement(text) {
    const task = document.createElement('div');
    task.className = 'task';
    task.draggable = true;
    task.textContent = text;

    // 删除按钮
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete';
    deleteBtn.onclick = function () {
        if (confirm('确定要删除这个任务吗？')) {
            task.remove();
        }
    };
    task.appendChild(deleteBtn);

    task.ondragstart = function (e) {
        e.dataTransfer.setData('text/plain', e.target.id);
    };

    return task;
}

// 允许拖拽
function allowDrop(e) {
    e.preventDefault();
}

// 拖拽释放
function drop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const task = document.getElementById(data);
    e.target.appendChild(task);
}

// 为动态创建的任务设置 ID（可选增强）
let taskId = 0;
window.addEventListener('load', function () {
    document.getElementById('taskInput').focus();
});