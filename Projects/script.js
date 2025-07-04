const goalDisplay = document.getElementById('goalDisplay');
const customGoalInput = document.getElementById('customGoal');
const setGoalBtn = document.getElementById('setGoal');
const cupsContainer = document.getElementById('cupsContainer');
const percentage = document.getElementById('percentage');
const remained = document.getElementById('remained');
const liters = document.getElementById('liters');
const modeToggle = document.getElementById('toggle-mode');
const motivationText = document.getElementById('motivation');
const cupVolume = 250;

let goalLiters = null;
const today = new Date().toDateString();
const savedDate = localStorage.getItem('goalDate');
const savedGoal = localStorage.getItem('goalLiters');

// Ask for new goal if it's a new day or no goal stored
if (savedDate === today && savedGoal) {
  goalLiters = parseFloat(savedGoal);
  startTracker();
} else {
  customGoalInput.style.display = 'inline-block';
  setGoalBtn.style.display = 'inline-block';
  goalDisplay.innerText = 'Not set';
}

// When user sets a goal
setGoalBtn.onclick = () => {
  const newGoal = parseFloat(customGoalInput.value);
  if (!isNaN(newGoal) && newGoal > 0) {
    goalLiters = newGoal;
    localStorage.setItem('goalLiters', goalLiters);
    localStorage.setItem('goalDate', today);
    customGoalInput.style.display = 'none';
    setGoalBtn.style.display = 'none';
    startTracker();
  }
};

function startTracker() {
  document.getElementById('goalSection').style.display = 'block';
  goalDisplay.innerText = goalLiters;
  generateCups();
  loadProgress();
  updateBigCup();
  requestNotificationPermission();
  setInterval(dailyReset, 60000);
  setInterval(remindUser, 3600000);
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
}

function generateCups() {
  cupsContainer.innerHTML = '';
  const numCups = Math.ceil((goalLiters * 1000) / cupVolume);
  for (let i = 0; i < numCups; i++) {
    const div = document.createElement('div');
    div.className = 'cup cup-small';
    div.innerText = `${cupVolume} ml`;
    div.addEventListener('click', () => toggleCup(i));
    cupsContainer.appendChild(div);
  }
}

function toggleCup(idx) {
  const cups = document.querySelectorAll('.cup-small');
  if (cups[idx].classList.contains('full') && !cups[idx].nextElementSibling?.classList.contains('full')) {
    idx--;
  }
  cups.forEach((cup, i) => {
    cup.classList.toggle('full', i <= idx);
  });
  updateBigCup();
  saveProgress();
}

function updateBigCup() {
  const fullCups = document.querySelectorAll('.cup-small.full').length;
  const totalCups = document.querySelectorAll('.cup-small').length;
  const percentageVal = (fullCups / totalCups) * 100;
  const remaining = goalLiters - ((cupVolume * fullCups) / 1000);

  percentage.style.visibility = percentageVal ? 'visible' : 'hidden';
  percentage.style.height = `${(percentageVal / 100) * 330}px`;
  percentage.innerText = `${percentageVal}%`;

  remained.style.visibility = remaining <= 0 ? 'hidden' : 'visible';
  liters.innerText = `${remaining.toFixed(1)}L`;

  showMotivation(percentageVal);

  if (percentageVal === 100) {
    alert('🎉 Goal achieved!');
    saveHistory();
  }
}

function saveProgress() {
  const full = [...document.querySelectorAll('.cup-small')].map(c => c.classList.contains('full'));
  localStorage.setItem('cups', JSON.stringify(full));
}

function loadProgress() {
  const saved = JSON.parse(localStorage.getItem('cups')) || [];
  document.querySelectorAll('.cup-small').forEach((cup, i) => {
    if (saved[i]) cup.classList.add('full');
  });
}

function showMotivation(percentage) {
  if (percentage >= 100) {
    motivationText.innerText = '🟥 🔥 You\'re crushing it! Goal achieved!';
  } else if (percentage >= 75) {
    motivationText.innerText = '🟨 Almost there! Don\'t stop now!';
  } else if (percentage >= 50) {
    motivationText.innerText = '🟩 Halfway there! You\'re doing great!';
  } else if (percentage >= 25) {
    motivationText.innerText = '🟦 Nice start! Keep going!';
  } else {
    motivationText.innerText = '';
  }
}

function dailyReset() {
  const today = new Date().toDateString();
  if (localStorage.getItem('lastReset') !== today) {
    localStorage.setItem('lastReset', today);
    localStorage.removeItem('cups');
    generateCups();
    updateBigCup();
  }
}

function remindUser() {
  if (Notification.permission === 'granted') {
    new Notification('💧 Time to drink water!', {
      body: 'Stay hydrated by clicking a cup.',
    });
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

modeToggle.onclick = () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
};

function saveHistory() {
  const history = JSON.parse(localStorage.getItem('weeklyHistory') || '[]');
  const today = new Date().toLocaleDateString();
  history.push({ date: today, amount: goalLiters });
  localStorage.setItem('weeklyHistory', JSON.stringify(history.slice(-7)));
  drawChart();
}

function drawChart() {
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  const data = JSON.parse(localStorage.getItem('weeklyHistory') || '[]');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Liters',
        data: data.map(d => d.amount),
        backgroundColor: '#6ab3f8'
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, suggestedMax: 4 } }
    }
  });
}
