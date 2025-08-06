// התחברות
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    alert(data.message);

    if (data.message.includes('התחברת')) {
      localStorage.setItem('username', username);
      location.reload();
    }
  });
}

// הצגת רכבים + ניהול התחברות
document.addEventListener('DOMContentLoaded', async () => {
  const username = localStorage.getItem('username');

  // אם מחובר - הצג שלום והתנתקות
  if (username) {
    const greeting = document.createElement('div');
    greeting.innerHTML = `היי, ${username}<br>ברוך הבא!<br>`;
    greeting.style.textAlign = 'left';
    greeting.style.padding = '10px';
    greeting.style.fontWeight = 'bold';
    document.body.prepend(greeting);

    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'התנתק';
    logoutBtn.style.margin = '10px';
    logoutBtn.style.float = 'left';
    logoutBtn.style.backgroundColor = '#e74c3c';
    logoutBtn.style.color = '#fff';
    logoutBtn.style.border = 'none';
    logoutBtn.style.padding = '8px 12px';
    logoutBtn.style.borderRadius = '5px';
    logoutBtn.style.cursor = 'pointer';
    greeting.appendChild(logoutBtn);

      const addCarBtn = document.createElement('a');
  addCarBtn.href = 'add-car.html';
  addCarBtn.textContent = 'העלה רכב למכירה';
  addCarBtn.style.margin = '10px';
  addCarBtn.style.float = 'left';
  addCarBtn.style.backgroundColor = '#3498db';
  addCarBtn.style.color = '#fff';
  addCarBtn.style.border = 'none';
  addCarBtn.style.padding = '8px 12px';
  addCarBtn.style.borderRadius = '5px';
  addCarBtn.style.cursor = 'pointer';
  addCarBtn.style.textDecoration = 'none';

  greeting.appendChild(addCarBtn);

    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('username');
      location.reload();
    });

    // הסתר טופס התחברות והרשמה
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.style.display = 'none';

    const regLink = document.querySelector('a[href="register.html"]');
    const addCarLink = document.querySelector('a[href="add-car.html"]');
    if (regLink) regLink.style.display = 'none';
    if (addCarLink) addCarLink.style.display = 'none';
  }

  // הצגת רכבים
  const carsList = document.getElementById('cars-list');
  if (!carsList) return;

  try {
    const res = await fetch('/api/cars');
    const cars = await res.json();

    if (cars.length === 0) {
      carsList.innerHTML = '<p>אין רכבים להצגה כרגע.</p>';
    } else {
      cars.forEach(car => {
        const carDiv = document.createElement('div');
        carDiv.style.border = '1px solid #ccc';
        carDiv.style.padding = '10px';
        carDiv.style.margin = '10px';

        carDiv.innerHTML = `
          <h3>${car.manufacturer} ${car.model}</h3>
          <p><strong>שנה:</strong> ${car.year}</p>
          <p><strong>תיאור:</strong> ${car.description}</p>
        `;

        carsList.appendChild(carDiv);
      });
    }
  } catch (error) {
    carsList.innerHTML = '<p>שגיאה בטעינת הרכבים.</p>';
    console.error(error);
  }
});
