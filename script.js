// Target Timer
let targetTimer;
const startTargetTimer = document.getElementById('start-target-timer');
const targetTimeInput = document.getElementById('target-time');
const targetTimerDisplay = document.getElementById('target-timer-display');
const timerCircle = document.getElementById('timer-circle');
const circleCircumference = 2 * Math.PI * 90; // 2πr

// Load timer state from local storage
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.href = 'signin.html';
}

function getUserKey(key) {
    return `${currentUser}_${key}`;
}

speak("Hey, I'm Productive Mind. Let's get started!");

let timerState = JSON.parse(localStorage.getItem(getUserKey('timerState'))) || {
    running: false,
    endTime: 0,
    initialSeconds: 0,
    stepTimers: [] // Add this to store step timer information
};

function updateTimerDisplay(remainingSeconds) {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    targetTimerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateCircle(remainingSeconds, totalSeconds) {
    const offset = circleCircumference * (1 - remainingSeconds / totalSeconds);
    timerCircle.style.strokeDashoffset = offset;
}

// Modify the updateTargetTimer function
function updateTargetTimer(elapsedTime, stepText) {
    const totalSeconds = timerState.initialSeconds;
    const now = new Date().getTime();
    const remainingSeconds = Math.max(0, Math.floor((timerState.endTime - now) / 1000));
    updateTimerDisplay(remainingSeconds);
    updateCircle(remainingSeconds, totalSeconds);

    // Add step info to the timer display as a colored segment
    const stepPercentage = (elapsedTime / totalSeconds) * 100;
    const stepColor = getRandomColor();

    timerState.stepTimers.push({ text: stepText, percentage: stepPercentage, color: stepColor });

    updateStepSegments();
    saveTimerState();
}

function updateStepSegments() {
    const svg = document.querySelector('#timer-container svg');
    const existingSegments = svg.querySelectorAll('.step-segment');
    existingSegments.forEach(segment => segment.remove());

    let cumulativePercentage = 0;
    timerState.stepTimers.forEach((step, index) => {
        const segment = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        segment.setAttribute('cx', '100');
        segment.setAttribute('cy', '100');
        segment.setAttribute('r', '90');
        segment.setAttribute('fill', 'none');
        segment.setAttribute('stroke', step.color);
        segment.setAttribute('stroke-width', '10');
        segment.setAttribute('class', 'step-segment');

        const segmentLength = circleCircumference * (step.percentage / 100);
        segment.setAttribute('stroke-dasharray', `${segmentLength} ${circleCircumference}`);

        const rotation = cumulativePercentage * 3.6 - 90; // 3.6 degrees per percentage point
        segment.setAttribute('transform', `rotate(${rotation} 100 100)`);

        svg.appendChild(segment);
        cumulativePercentage += step.percentage;
    });
}

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
}

// Add a new function to update step segments without affecting the target timer
function updateStepSegmentsOnly() {
    const svg = document.querySelector('#timer-container svg');
    const existingSegments = svg.querySelectorAll('.step-segment');
    existingSegments.forEach(segment => segment.remove());

    let cumulativePercentage = 0;
    timerState.stepTimers.forEach((step, index) => {
        const segment = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        segment.setAttribute('cx', '100');
        segment.setAttribute('cy', '100');
        segment.setAttribute('r', '90');
        segment.setAttribute('fill', 'none');
        segment.setAttribute('stroke', step.color);
        segment.setAttribute('stroke-width', '10');
        segment.setAttribute('class', 'step-segment');

        const segmentLength = circleCircumference * (step.percentage / 100);
        segment.setAttribute('stroke-dasharray', `${segmentLength} ${circleCircumference}`);

        const rotation = cumulativePercentage * 3.6 - 90; // 3.6 degrees per percentage point
        segment.setAttribute('transform', `rotate(${rotation} 100 100)`);

        svg.appendChild(segment);
        cumulativePercentage += step.percentage;
    });
}

// Add this function to play the bell sound
function playBellSound() {
    const bellSound = document.getElementById('bell-sound');
    bellSound.play();
}

// Function to speak text using Web Speech API
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}


// Modify the showStepTimerPopup function
function showStepTimerPopup(taskIndex, stepIndex) {
    const step = tasks[taskIndex].steps[stepIndex];
    const popup = document.createElement('div');
    popup.className = 'step-timer-popup';
    popup.innerHTML = `
        <div class="step-timer-content">
            <h3>${step.text}</h3>
            <div class="step-timer-display">${formatTime(step.remainingTime)}</div> 
            <button class="btn btn-secondary pause-step-timer">Pause Timer</button>
        </div>
    `;
    document.body.appendChild(popup);

    const pauseBtn = popup.querySelector('.pause-step-timer');
    let prod=true;

    // Pause Restart Timer
    let pauseRestartTimer;
    let timeLost = 0;
    let pauseTime = 0;

    // Modify the Pause Button Functionality
    pauseBtn.addEventListener('click', () => {
        if (step.timerRunning) {
            clearInterval(step.timerInterval);
            pauseTime = new Date().getTime(); // Store pause time
            speak('Why are you stopping your productive task?');
            pauseRestartTimer = setInterval(() => {
                timeLost = Math.floor((new Date().getTime() - pauseTime) / 1000);
                pauseBtn.textContent = `Restart Timer`;
            }, 1000);
            step.timerRunning = false;
        } else {
            // Restart from pause
            clearInterval(pauseRestartTimer);
            speak(`You have lost ${formatTime(timeLost)} of your productive time, What did you do during that time?`);
            let reason = prompt(`You have lost ${formatTime(timeLost)} of your productive time, What did you do during that time?`);

            while (reason !== "productive" && reason !== "not productive") { // Keep prompting until valid input
                speak("Please enter 'productive' or 'not productive'.");
                reason = prompt(`You have lost ${formatTime(timeLost)} of your productive time, What did you do during that time?`);
            }

            if (reason === "productive") {
                speak("You have done a productive task, so you can restart the timer.");
                prod=true;
                // Restart from the paused time
                step.startTime = new Date().getTime() - (step.elapsedTime * 1000);
            } else if (reason === "not productive") {
                speak("You have not done any productive task, so your productive time is lost.");
                prod=false;
                // Restart after subtracting time lost from the paused time
                step.elapsedTime += timeLost;
                step.startTime = new Date().getTime() - (step.elapsedTime * 1000);
            }
            step.timerRunning = true; // Restart the timer
            startStepTimer(taskIndex, stepIndex);
            pauseBtn.textContent = 'Pause Timer';
        }
    });


    let lastBellTime = Math.floor(step.elapsedTime / 1800) * 1800; // Round down to the nearest 30 minutes

    function startStepTimer(taskIndex, stepIndex) {
        step.timerInterval = setInterval(() => {
            const now = new Date().getTime();
            const totalElapsed = Math.floor((now - step.startTime) / 1000);
            step.elapsedTime = totalElapsed; // Keep track of actual elapsed time
            step.remainingTime = step.initialTime - totalElapsed; // Calculate remaining time
            popup.querySelector('.step-timer-display').textContent = formatTime(step.remainingTime); // Display remaining time

            // Check if 30 minutes have passed since the last bell
            if (totalElapsed - lastBellTime >= 1800) {
                playBellSound();
                lastBellTime = totalElapsed;
            }

            saveTasks();
            updateStepSegmentsOnly();

            if (step.remainingTime <= 1) {
                playBellSound();
            }

            // Check if time is up
            if (step.remainingTime <= 0) {
                clearInterval(step.timerInterval);
                step.timerRunning = false;
                if (prod === false) {
                    alert("You have wasted time and not completed the task");
                    step.completed = false;
                } else {
                    step.completed = true;
                }
                
                // Prompt for additional time
                speak("Time's up! Do you need more time (in hours or minutes)?");
                let additionalTime = prompt("Time's up! Do you need more time (in hours [H] or minutes [M])?");
                while (additionalTime !== null && (isNaN(parseFloat(additionalTime.slice(0, -1))) || parseFloat(additionalTime.slice(0, -1)) <= 0 || (additionalTime.slice(-1).toUpperCase() !== 'H' && additionalTime.slice(-1).toUpperCase() !== 'M'))) { // Keep prompting until valid input
                    speak("Please enter a valid time in hours or minutes (e.g., 1.5H or 30M).");
                    additionalTime = prompt("Time's up! Do you need more time (in hours [H] or minutes [M])?");
                } 

                if (additionalTime !== null && additionalTime !== "no") {
                    const timeValue = parseFloat(additionalTime.slice(0, -1)); // Extract the number
                    const unit = additionalTime.slice(-1).toUpperCase(); // Extract the unit (H or M)

                    let additionalTimeInMs;
                    if (unit === 'H') {
                        additionalTimeInMs = timeValue * 3600 * 1000; // Convert hours to milliseconds
                    } else {
                        additionalTimeInMs = timeValue * 60 * 1000; // Convert minutes to milliseconds
                    }

                    // Add additional time to the remaining time and reset the timer
                    step.initialTime += additionalTimeInMs / 1000; // Update initialTime
                    step.remainingTime = step.initialTime; // Set remaining time to new initial time
                    step.startTime = new Date().getTime(); // Reset startTime
                    step.timerRunning = true;
                    startStepTimer(taskIndex, stepIndex);
                    return; // Exit the interval function
                } else {
                    speak("You have successfully completed the task.");
                    alert("You have successfully completed the task.");
                }


                popup.style.display = "none"; // Hide popup
                speak("Time's up!");
                alert("Time's up!");
                updateTargetTimer(step.elapsedTime, step.text); // Update target timer
                renderTasks();
                saveTasks();
            }
        }, 1000);
    }

    // Start timer when the popup is shown
    startStepTimer(taskIndex, stepIndex);
}

// Modify the toggleStepTimer function to handle completion and more time
function toggleStepTimer(taskIndex, stepIndex) {
    const step = tasks[taskIndex].steps[stepIndex];
    step.timerRunning = !step.timerRunning;

    if (step.timerRunning) {
        speak("How much time do you need to complete this step (in hours or minutes)?");
        let timeNeeded = prompt("How much time do you need to complete this step (in hours [H] or minutes [M])?");
        while (isNaN(parseFloat(timeNeeded.slice(0, -1))) || parseFloat(timeNeeded.slice(0, -1)) <= 0 || (timeNeeded.slice(-1).toUpperCase() !== 'H' && timeNeeded.slice(-1).toUpperCase() !== 'M')) { 
            speak("Please enter a valid time in hours (e.g., 1.5H) or minutes (e.g., 30M).");
            timeNeeded = prompt("How much time do you need to complete this step (in hours [H] or minutes [M])?");
        } 
        if (timeNeeded !== null) {
            const timeValue = parseFloat(timeNeeded.slice(0, -1)); // Extract the number
            const unit = timeNeeded.slice(-1).toUpperCase(); // Extract the unit (H or M)
           if (isNaN(timeValue) || timeValue <= 0 || (unit !== 'H' && unit !== 'M')) {
                speak("Please enter a valid time in hours or minutes.");
                alert("Please enter a valid time in hours (e.g., 1.5H) or minutes (e.g., 30M).");
                return;
            }

            let timeInMs;
            if (unit === 'H') {
                timeInMs = timeValue * 3600 * 1000; // Convert hours to milliseconds
            } else {
                timeInMs = timeValue * 60 * 1000; // Convert minutes to milliseconds
            }

            // Store the initial time and set remaining time to initial time
            step.initialTime = timeInMs / 1000; // Store in seconds
            step.remainingTime = step.initialTime;

            step.startTime = new Date().getTime(); // Start the timer
            showStepTimerPopup(taskIndex, stepIndex);
        }
    } else {
        hideStepTimerPopup();
        clearInterval(step.timerInterval);
        const now = new Date().getTime();
        const elapsedSinceStart = now - step.startTime;
        step.elapsedTime = Math.floor(elapsedSinceStart / 1000); // Update elapsed time

        // Prompt for additional time when timer is stopped
        speak("Do you need more time (in hours or minutes)?");
        let additionalTime = prompt("Do you need more time (in hours [H] or minutes [M])?");
        while (additionalTime !== null && (isNaN(parseFloat(additionalTime.slice(0, -1))) || parseFloat(additionalTime.slice(0, -1)) <= 0 || (additionalTime.slice(-1).toUpperCase() !== 'H' && additionalTime.slice(-1).toUpperCase() !== 'M'))) {
            speak("Please enter a valid time in hours (e.g., 1.5H) or minutes (e.g., 30M).");
            additionalTime = prompt("Do you need more time (in hours [H] or minutes [M])?");
        } 
        if (additionalTime !== null) {
            const timeValue = parseFloat(additionalTime.slice(0, -1)); // Extract the number
            const unit = additionalTime.slice(-1).toUpperCase(); // Extract the unit (H or M)

            let additionalTimeInMs;
            if (unit === 'H') {
                additionalTimeInMs = timeValue * 3600 * 1000; // Convert hours to milliseconds
            } else {
                additionalTimeInMs = timeValue * 60 * 1000; // Convert minutes to milliseconds
            }

            // Add additional time to the remaining time
            step.initialTime += additionalTimeInMs / 1000; // Update initialTime
            step.remainingTime = step.initialTime; // Set remaining time to new initial time
            step.startTime = new Date().getTime(); // Reset startTime
            step.timerRunning = true; // Restart the timer
            showStepTimerPopup(taskIndex, stepIndex);
            return; // Exit the function
        } else {
            step.completed = true; // Mark the step as complete
            updateTargetTimer(step.elapsedTime, step.text); // Update target timer
        }

        renderTasks();
        saveTasks();
    }
}


// Modify the startTimer function
function startTimer() {
    clearInterval(targetTimer);
    timerState.stepTimers = []; // Reset step timers
    updateStepSegments(); // Clear step segments
    targetTimer = setInterval(() => {
        const now = new Date().getTime();
        const remainingSeconds = Math.max(0, Math.floor((timerState.endTime - now) / 1000));
        updateTimerDisplay(remainingSeconds);
        updateCircle(remainingSeconds, timerState.initialSeconds);

        if (remainingSeconds <= 0) {
            clearInterval(targetTimer);
            timerState.running = false;
            speak('Target time reached!');
            alert('Target time reached!');
        }
        saveTimerState();
    }, 1000);
}

startTargetTimer.addEventListener('click', () => {
    const hours = parseFloat(targetTimeInput.value);
    if (isNaN(hours) || hours <= 0) {
        speak('Please enter a valid time in hours or minutes.');
        alert('Please enter a valid time in hours or minutes.');
        return;
    }

    const now = new Date().getTime();
    timerState.endTime = now + hours * 3600 * 1000;
    timerState.initialSeconds = Math.floor(hours * 3600);
    timerState.running = true;
    timerState.stepTimers = []; // Reset step timers

    updateTimerDisplay(timerState.initialSeconds);
    updateCircle(timerState.initialSeconds, timerState.initialSeconds);
    updateStepSegments();
    startTimer();
    saveTimerState(); // Save the initial timer state
});

if (timerState.running && timerState.endTime > new Date().getTime()) {
    const remainingSeconds = Math.floor((timerState.endTime - new Date().getTime()) / 1000);
    updateTimerDisplay(remainingSeconds);
    updateCircle(remainingSeconds, timerState.initialSeconds);
    updateStepSegments(); // Restore step segments
    startTimer();
} else {
    timerState.running = false;
    saveTimerState();
}

// Task Creation
const addTaskBtn = document.getElementById('add-task');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
let tasks = JSON.parse(localStorage.getItem(getUserKey('tasks'))) || [];

addTaskBtn.addEventListener('click', addTask);

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText) {
        const newTask = { text: taskText, steps: [], completed: false };
        tasks.push(newTask);
        renderTasks();
        saveTasks();
        taskInput.value = '';
    }
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, taskIndex) => {
        const li = document.createElement('li');
        li.className = 'list-group-item task-item';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <input type="checkbox" class="form-check-input me-2 task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary add-step" data-task-index="${taskIndex}">Add Step</button>
                    <button class="btn btn-sm btn-outline-danger remove-task" data-task-index="${taskIndex}">Remove</button>
                </div>
            </div>
            <ul class="step-list list-group mt-2"></ul>
        `;
        const stepList = li.querySelector('.step-list');
        task.steps.forEach((step, stepIndex) => {
            const stepItem = createStepItem(step, taskIndex, stepIndex);
            stepList.appendChild(stepItem);
        });
        taskList.appendChild(li);
    });
}

function createStepItem(step, taskIndex, stepIndex) {
    const stepItem = document.createElement('li');
    stepItem.className = 'list-group-item step-item';
    stepItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <input type="checkbox" class="form-check-input me-2 step-checkbox" ${step.completed ? 'checked' : ''}>
                <span>${step.text}</span>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-primary toggle-step-timer" data-task-index="${taskIndex}" data-step-index="${stepIndex}">${step.timerRunning ? 'Stop' : 'Start'}</button>
                <button class="btn btn-sm btn-outline-danger remove-step" data-task-index="${taskIndex}" data-step-index="${stepIndex}">Remove</button>
            </div>
        </div>
        <div class="step-timer mt-2">Time: ${formatTime(step.elapsedTime)}</div>
    `;
    return stepItem;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function saveTasks() {
    localStorage.setItem(getUserKey('tasks'), JSON.stringify(tasks));
}

taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-step')) {
        const taskIndex = e.target.dataset.taskIndex;
        addStep(taskIndex);
    } else if (e.target.classList.contains('remove-task')) {
        const taskIndex = e.target.dataset.taskIndex;
        tasks.splice(taskIndex, 1);
        renderTasks();
        saveTasks();
    } else if (e.target.classList.contains('remove-step')) {
        const taskIndex = e.target.dataset.taskIndex;
        const stepIndex = e.target.dataset.stepIndex;
        tasks[taskIndex].steps.splice(stepIndex, 1);
        renderTasks();
        saveTasks();
    } else if (e.target.classList.contains('toggle-step-timer')) {
        const taskIndex = e.target.dataset.taskIndex;
        const stepIndex = e.target.dataset.stepIndex;
        toggleStepTimer(taskIndex, stepIndex);
    } else if (e.target.classList.contains('task-checkbox')) {
        const taskIndex = e.target.closest('.task-item').querySelector('.add-step').dataset.taskIndex;
        tasks[taskIndex].completed = e.target.checked;
        saveTasks();
    } else if (e.target.classList.contains('step-checkbox')) {
        const taskIndex = e.target.closest('.task-item').querySelector('.add-step').dataset.taskIndex;
        const stepIndex = e.target.closest('.step-item').querySelector('.toggle-step-timer').dataset.stepIndex;
        tasks[taskIndex].steps[stepIndex].completed = e.target.checked;
        saveTasks();
    }
});

function addStep(taskIndex) {
    speak("What's the name of this step?");
    const stepText = prompt('Enter step name:');
    if (stepText) {
        tasks[taskIndex].steps.push({ text: stepText, elapsedTime: 0, timerRunning: false, completed: false });
        renderTasks();
        saveTasks();
    }
}

function hideStepTimerPopup() {
    const popup = document.querySelector('.step-timer-popup');
    if (popup) {
        popup.remove();
    }
}

// Daily Routine
let routines = JSON.parse(localStorage.getItem(getUserKey('routines'))) || {};

const daySelect = document.getElementById('day-select');
const routineContainer = document.getElementById('routine-container');
const trackerCalendar = document.getElementById('tracker-calendar');
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

daySelect.addEventListener('change', () => {
    const selectedDay = daySelect.value;
    if (selectedDay) {
        renderRoutines(selectedDay);
    } else {
        routineContainer.innerHTML = '';
    }
});

function renderRoutines(day) {
    routineContainer.innerHTML = `
        <h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
        <input type="text" class="form-control routine-input" placeholder="Enter routine task">
        <button class="btn btn-primary add-routine mt-2">Add Routine</button>
        <ul class="routine-list list-group mt-2"></ul>
        <button class="btn btn-success mark-day-complete mt-2">Mark Day as Complete</button>
    `;

    const addRoutineBtn = routineContainer.querySelector('.add-routine');
    const routineInput = routineContainer.querySelector('.routine-input');
    const routineList = routineContainer.querySelector('.routine-list');
    const markDayCompleteBtn = routineContainer.querySelector('.mark-day-complete');

    if (routines[day]) {
        routines[day].forEach((routine, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <input type="checkbox" class="form-check-input me-2 routine-checkbox" data-day="${day}" data-index="${index}" ${routine.completed ? 'checked' : ''}>
                    <span>${routine.text}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-routine" data-day="${day}" data-index="${index}">Remove</button>
            `;
            routineList.appendChild(li);
        });
    }

    addRoutineBtn.addEventListener('click', () => {
        const routineText = routineInput.value.trim();
        if (routineText) {
            if (!routines[day]) {
                routines[day] = [];
            }
            routines[day].push({ text: routineText, completed: false });
            renderRoutines(day);
            saveRoutines();
            routineInput.value = '';
        }
    });

    markDayCompleteBtn.addEventListener('click', () => {
        const completedRoutines = routineList.querySelectorAll('input[type="checkbox"]:checked');
        if (completedRoutines.length === routineList.children.length && routineList.children.length > 0) {
            speak("Great job! You've completed all routines for today.");
            alert(`Great job! You've completed all routines for today.`);
            updateTrackerCalendar();
            routines[day].forEach(routine => routine.completed = true
            );
            saveRoutines();
            createCalendar(currentYear, currentMonth);
        } else {
            speak('Please complete all routines before marking the day as complete.');
            alert('Please complete all routines before marking the day as complete.');
        }
    });

    routineList.addEventListener('change', (e) => {
        if (e.target.classList.contains('routine-checkbox')) {
            const day = e.target.dataset.day;
            const index = parseInt(e.target.dataset.index);
            routines[day][index].completed = e.target.checked;
            saveRoutines();
        }
    });

    routineList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-routine')) {
            const day = e.target.dataset.day;
            const index = parseInt(e.target.dataset.index);
            routines[day].splice(index, 1);
            renderRoutines(day);
            saveRoutines();
        }
    });
}

function saveRoutines() {
    localStorage.setItem(getUserKey('routines'), JSON.stringify(routines));
}

function createCalendar(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    trackerCalendar.innerHTML = '';

    const monthYearDisplay = document.createElement('div');
    monthYearDisplay.className = 'month-year-display';
    monthYearDisplay.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
    trackerCalendar.appendChild(monthYearDisplay);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayNameElement = document.createElement('div');
        dayNameElement.className = 'calendar-day-name';
        dayNameElement.textContent = day;
        trackerCalendar.appendChild(dayNameElement);
    });

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        trackerCalendar.appendChild(emptyDay);
    }

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const calendarDay = document.createElement('div');
        calendarDay.className = 'calendar-day';
        const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        if (dateString === todayString) {
            calendarDay.classList.add('current-day');
            if (completedDays[dateString]) {
                calendarDay.classList.add('completed');
                const tick = document.createElement('div');
                tick.className = 'tick';
                calendarDay.appendChild(tick);
            }
        } else if (completedDays[dateString]) {
            calendarDay.classList.add('past-completed');
        }

        calendarDay.textContent = day;
        trackerCalendar.appendChild(calendarDay);
    }
}

let completedDays = JSON.parse(localStorage.getItem(getUserKey('completedDays'))) || {};

function updateTrackerCalendar() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    completedDays[dateString] = true;
    localStorage.setItem(getUserKey('completedDays'), JSON.stringify(completedDays));

    createCalendar(today.getFullYear(), today.getMonth());
}

const summaryDisplay = document.getElementById('summary-display');

function updateDaySummary() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Reset total time and completed tasks at the beginning of the day
    let totalTime = 0;
    let completedTasksList = '';

    // Check if the day has changed and reset the timer if needed
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        // Reset step timers and elapsed times
        tasks.forEach(task => {
            task.steps.forEach(step => {
                step.elapsedTime = 0;
                step.timerRunning = false;
                
                if (step.timerInterval) {
                    clearInterval(step.timerInterval);
                }
            });
        });
        saveTasks();
        renderTasks();

        // Reset target timer state
        timerState = {
            running: false,
            endTime: 0,
            initialSeconds: 0,
            stepTimers: []
        };
        saveTimerState();
    }

    // Calculate total time and completed tasks for the current day
    tasks.forEach(task => {
        const taskTime = task.steps.reduce((acc, step) => acc + step.elapsedTime, 0);
        totalTime += taskTime;
        if (task.completed) {
            completedTasksList += `<li>${task.text} - ${formatTime(taskTime)}</li>`;
        }
    });

    // Format the summary string
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const summary = `
        <h3>Today's Summary (${now.toLocaleDateString()}):</h3>
        <p>Total Productive Time: ${hours} hours ${minutes} minutes</p>
        <h4>Completed Tasks:</h4>
        <ul>${completedTasksList}</ul>
    `;

    // Update the summary display
    summaryDisplay.innerHTML = summary;

    // Save the summary for the current day if it's past 11 pm
    if (now.getHours() >= 23) {
        localStorage.setItem(getUserKey(`summary_${today}`), summary);
    }
}


// Function to retrieve past summary
function getPastSummary(dateString) {
    const storedSummary = localStorage.getItem(getUserKey(`summary_${dateString}`));
    if (storedSummary) {
        summaryDisplay.innerHTML = storedSummary;
        return true; // Summary found
    } else {
        speak("No summary found for the given date.");
        alert("No summary found for the given date.");
        return false; // Summary not found
    }
}

// Add a button to get past summary
const getPastSummaryBtn = document.createElement('button');
getPastSummaryBtn.textContent = 'Get Past Summary';
getPastSummaryBtn.className = 'btn btn-primary mt-3';
summaryDisplay.parentNode.insertBefore(getPastSummaryBtn, summaryDisplay);

getPastSummaryBtn.addEventListener('click', () => {
    const dateInput = prompt('Enter the date (YYYY-MM-DD):');
    if (dateInput) {
        const dateString = dateInput.trim();
        getPastSummary(dateString); 
    }
});

loadRoutines();
renderTasks();
createCalendar(currentYear, currentMonth);
updateDaySummary();

setInterval(updateDaySummary, 1000);

const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];
daySelect.value = currentDay;
renderRoutines(currentDay);

// Speak a message about the daily routine
if (routines[currentDay] && routines[currentDay].length > 0) {
    speak(`Today's routine is: ${routines[currentDay].map(routine => routine.text).join(', ')}`);
} else {
    speak("You have not added any routine for the day, please add the routine and be productive.");
}

const selectRandomTaskBtn = document.createElement('button');
selectRandomTaskBtn.textContent = 'Select Random Task';
selectRandomTaskBtn.className = 'btn btn-primary mt-3';
taskList.parentNode.insertBefore(selectRandomTaskBtn, taskList);

selectRandomTaskBtn.addEventListener('click', () => {
    if (tasks.length > 0) {
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        showRandomTaskPopup(randomTask.text);
    } else {
        speak('No tasks available to select from.');
        alert('No tasks available to select from.');
    }
});

function showRandomTaskPopup(taskText) {
    const popup = document.createElement('div');
    popup.className = 'random-task-popup';
    popup.innerHTML = `
        <div class="random-task-content">
            <h3>Selected Task:</h3>
            <p>${taskText}</p>
            <button class="btn btn-primary close-popup">Close</button>
        </div>
    `;
    document.body.appendChild(popup);

    popup.querySelector('.close-popup').addEventListener('click', () => {
        popup.remove();
    });
}

const signoutBtn = document.getElementById('signout-btn');
signoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'signin.html';
});

function loadRoutines() {
    const savedRoutines = localStorage.getItem(getUserKey('routines'));
    if (savedRoutines) {
        routines = JSON.parse(savedRoutines);
    }
}

loadRoutines();

window.addEventListener('beforeunload', () => {
    saveTimerState();
});

function initializeStepTimers() {
    tasks.forEach((task, taskIndex) => {
        task.steps.forEach((step, stepIndex) => {
            if (step.timerRunning) {
                step.startTime = new Date().getTime() - (step.elapsedTime * 1000);
                showStepTimerPopup(taskIndex, stepIndex);
            }
        });
    });
}

function loadTasks() {
    tasks = JSON.parse(localStorage.getItem(getUserKey('tasks'))) || [];
    renderTasks();
    initializeStepTimers();
}

loadTasks();

function saveTimerState() {
    localStorage.setItem(getUserKey('timerState'), JSON.stringify(timerState));
}




