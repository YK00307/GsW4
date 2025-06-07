let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentTaskId = null;
let editingTaskId = null;
let currentDate = new Date();

// ローカルストレージに保存
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// メイン画面の表示更新
function updateMainScreen() {
    const activeTaskList = document.getElementById('activeTaskList');
    const finishedTaskList = document.getElementById('finishedTaskList');
    const taskStatus = document.getElementById('taskStatus');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    
    const now = new Date();
    const activeTasks = [];
    const finishedTasks = [];
    
    // タスクを現在進行中と完了・期限切れに分類
    tasks.forEach(task => {
        const endDate = new Date(task.endDateTime);
        if (task.completed || endDate < now) {
            finishedTasks.push(task);
        } else {
            activeTasks.push(task);
        }
    });
    
    // アクティブタスクを終了時刻順にソート
    activeTasks.sort((a, b) => new Date(a.endDateTime) - new Date(b.endDateTime));
    
    // 完了済み・期限切れタスクを終了時刻順にソート
    finishedTasks.sort((a, b) => new Date(b.endDateTime) - new Date(a.endDateTime));
    
    const completedTasks = tasks.filter(task => task.completed);
    taskStatus.textContent = `現在：${completedTasks.length}/${tasks.length} タスク完了`;
    
    // アクティブタスクの表示
    activeTaskList.innerHTML = '';
    activeTasks.forEach(task => createTaskElement(task, activeTaskList, false));
    
    // 完了済み・期限切れタスクの表示
    finishedTaskList.innerHTML = '';
    finishedTasks.forEach(task => createTaskElement(task, finishedTaskList, true));
    
    // 一括削除ボタンの表示制御
    bulkDeleteBtn.style.display = finishedTasks.length > 0 ? 'block' : 'none';
}

// タスク要素の作成
function createTaskElement(task, container, isFinished) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const startDate = new Date(task.startDateTime);
    const endDate = new Date(task.endDateTime);
    const now = new Date();
    const diffTime = endDate - now;
    
    // 期限切れの場合は背景色を変更
    if (!task.completed && endDate < now) {
        taskDiv.classList.add('expired');
    }
    
    // 期間表示の作成
    const formatDateTime = (date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
    };
    
    const periodText = `${formatDateTime(startDate)} 〜 ${formatDateTime(endDate)}`;
    
    // 期限までの時間表示
    let deadlineText = '';
    let isUrgent = false;
    
    if (task.completed) {
        deadlineText = '完了済み';
    } else if (diffTime <= 0) {
        deadlineText = '期限切れ';
        isUrgent = true;
    } else {
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffMinutes <= 60) {
            deadlineText = `あと${diffMinutes}分`;
            isUrgent = true;
        } else if (diffHours <= 24) {
            deadlineText = `あと${diffHours}時間`;
            isUrgent = diffHours <= 6;
        } else {
            deadlineText = `あと${diffDays}日`;
            isUrgent = diffDays <= 1;
        }
    }
    
    taskDiv.innerHTML = `
        <div class="task-name">${task.name}</div>
        <div class="task-period">${periodText}</div>
        <div class="task-deadline ${isUrgent ? 'urgent' : ''}">${deadlineText}</div>
        ${!isFinished ? `<input type="checkbox" class="task-checkbox" onchange="toggleTask(${task.id})">` : ''}
    `;
    
    // ホバーでコメント表示
    taskDiv.addEventListener('mouseenter', function(e) {
        if (task.comment) {
            showTooltip(e.pageX, e.pageY, task.comment);
        }
    });
    
    taskDiv.addEventListener('mouseleave', function() {
        hideTooltip();
    });
    
    // クリックで編集画面へ
    taskDiv.addEventListener('click', function(e) {
        if (e.target.type !== 'checkbox') {
            currentTaskId = task.id;
            showScreen('screen3');
        }
    });
    
    container.appendChild(taskDiv);
}

// 完了済み・期限切れタスクの一括削除
function bulkDeleteFinishedTasks() {
    if (confirm('完了済み・期限切れのタスクをすべて削除しますか？')) {
        const now = new Date();
        tasks = tasks.filter(task => {
            const endDate = new Date(task.endDateTime);
            return !task.completed && endDate >= now;
        });
        saveTasks();
        updateMainScreen();
        updateCalendar();
    }
}

// ツールチップ表示
function showTooltip(x, y, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = text;
    tooltip.style.left = x + 'px';
    tooltip.style.top = (y - 40) + 'px';
    tooltip.classList.add('show');
}

function hideTooltip() {
    document.getElementById('tooltip').classList.remove('show');
}

// タスクの完了切り替え
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        updateMainScreen();
        updateCalendar();
    }
}

// 画面遷移
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// カレンダー表示
function showCalendar() {
    showScreen('screen4');
    updateCalendar();
}

// 追加画面表示
function showAddScreen() {
    editingTaskId = null;
    
    // フォームをクリア
    document.getElementById('taskName').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('taskComment').value = '';
    
    // ボタンの状態を設定
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('saveBtn').textContent = '追加';
    
    showScreen('screen2');
}

// タスク保存
function saveTask() {
    const name = document.getElementById('taskName').value;
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    const endDate = document.getElementById('endDate').value;
    const endTime = document.getElementById('endTime').value;
    const comment = document.getElementById('taskComment').value;
    
    if (!name || !startDate || !startTime || !endDate || !endTime) {
        alert('名前、開始日時、終了日時は必須です');
        return;
    }
    
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (startDateTime >= endDateTime) {
        alert('終了時刻は開始時刻より後に設定してください');
        return;
    }
    
    if (editingTaskId) {
        // 編集
        const task = tasks.find(t => t.id === editingTaskId);
        task.name = name;
        task.startDateTime = startDateTime.toISOString();
        task.endDateTime = endDateTime.toISOString();
        task.comment = comment;
    } else {
        // 新規追加
        const newTask = {
            id: Date.now(),
            name: name,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            comment: comment,
            completed: false
        };
        tasks.push(newTask);
    }
    
    saveTasks();
    goToMain();
}

// タスク削除
function deleteTask() {
    if (confirm('本当に削除しますか？')) {
        tasks = tasks.filter(t => t.id !== editingTaskId);
        saveTasks();
        goToMain();
    }
}

// タスク編集
function editTask() {
    const task = tasks.find(t => t.id === currentTaskId);
    if (task) {
        editingTaskId = task.id;
        
        const startDate = new Date(task.startDateTime);
        const endDate = new Date(task.endDateTime);
        
        document.getElementById('taskName').value = task.name;
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('startTime').value = startDate.toTimeString().slice(0, 5);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('endTime').value = endDate.toTimeString().slice(0, 5);
        document.getElementById('taskComment').value = task.comment || '';
        
        document.getElementById('deleteBtn').style.display = 'block';
        document.getElementById('saveBtn').textContent = '更新';
        
        showScreen('screen2');
    }
}

// タスク完了
function completeTask() {
    const task = tasks.find(t => t.id === currentTaskId);
    if (task) {
        task.completed = true;
        saveTasks();
        showPopup();
    }
}

// メイン画面に戻る
function goToMain() {
    showScreen('screen1');
    updateMainScreen();
}

// ポップアップ表示
function showPopup() {
    document.getElementById('completionPopup').style.display = 'block';
}

// ポップアップ閉じる
function closePopup() {
    document.getElementById('completionPopup').style.display = 'none';
    goToMain();
}

// カレンダー更新
function updateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthSpan = document.getElementById('currentMonth');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthSpan.textContent = `${year}年${month + 1}月`;
    
    // 月の最初の日と最後の日を取得
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    grid.innerHTML = '';
    
    // 曜日ヘッダー
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.style.background = '#f0f0f0';
        dayHeader.style.padding = '10px';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.fontWeight = 'bold';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });
    
    // カレンダーの日付セルを生成
    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        if (cellDate.getMonth() !== month) {
            dayCell.classList.add('other-month');
        }
        
        const today = new Date();
        if (cellDate.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = cellDate.getDate();
        dayCell.appendChild(dayNumber);
        
        // その日のタスクを表示
        const dayTasks = getTasksForDate(cellDate);
        dayTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `calendar-task ${task.completed ? 'completed' : ''}`;
            
            const now = new Date();
            const endDate = new Date(task.endDateTime);
            if (!task.completed && endDate < now) {
                taskElement.classList.add('expired');
            }
            
            taskElement.textContent = task.name;
            taskElement.addEventListener('click', (e) => {
                e.stopPropagation();
                currentTaskId = task.id;
                showScreen('screen3');
            });
            dayCell.appendChild(taskElement);
        });
        
        grid.appendChild(dayCell);
    }
}

// 指定日のタスクを取得
function getTasksForDate(date) {
const pad = n => n.toString().padStart(2, '0');
    const dateStr = [
  date.getFullYear(),
  pad(date.getMonth() + 1),
  pad(date.getDate())
].join('-');
    return tasks.filter(task => {
        const startDate = new Date(task.startDateTime).toISOString().split('T')[0];
        const endDate = new Date(task.endDateTime).toISOString().split('T')[0];
        return dateStr >= startDate && dateStr <= endDate;
    });
}

// 月変更
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    updateCalendar();
}

// 初期化
function init() {
    updateMainScreen();
}

// ページ読み込み時に初期化
window.onload = init;




// 修正前（UTC基準。これがズレの原因）
const dateStr = date.toISOString().split('T')[0];

// 修正後（ローカルタイム基準で日付を取得）
