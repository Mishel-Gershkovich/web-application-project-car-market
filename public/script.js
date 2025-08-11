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

  if (username) {
    
    // יצירת קונטיינר לימין עליון
    const container = document.createElement('div');

    // ברכה
    const greeting = document.createElement('div');
    greeting.innerHTML = `היי, ${username}<br>ברוך הבא!<br>`;
    greeting.style.textAlign = 'left';
    greeting.style.padding = '10px';
    greeting.style.fontWeight = 'bold';

    // כפתור התנתקות
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'התנתק';
    Object.assign(logoutBtn.style, {
      margin: '10px',
      float: 'left',
      backgroundColor: '#e74c3c',
      color: '#fff',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      cursor: 'pointer'
    });

    // כפתור העלאת רכב
    const addCarBtn = document.createElement('a');
    addCarBtn.href = 'add-car.html';
    addCarBtn.textContent = 'העלה רכב למכירה';
    Object.assign(addCarBtn.style, {
      margin: '10px',
      float: 'left',
      backgroundColor: '#3498db',
      color: '#fff',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      cursor: 'pointer',
      textDecoration: 'none'
    });

    // הוספה לדף
    container.appendChild(greeting);
    container.appendChild(logoutBtn);
    container.appendChild(addCarBtn);
    document.body.prepend(container);

    // אירוע התנתקות
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('username');
      location.reload();
    });

    // הסתר טופס התחברות והרשמה
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.style.display = 'none';
    // הסתר/הסר את כל כרטיס ההתחברות
    if (loginForm) {
    const wrapper = loginForm.closest('.auth-wrapper'); // העטיפה של הכרטיס
    if (wrapper) {
    wrapper.remove();           // מסיר מה-DOM (מומלץ)
    // או: wrapper.style.display = 'none';
    } else {
    loginForm.style.display = 'none';
    }
}

    const regLink = document.querySelector('a[href="register.html"]');
    //const addCarLink = document.querySelector('a[href="add-car.html"]');
    if (regLink) regLink.style.display = 'none';
    //if (addCarLink) addCarLink.style.display = 'none';
    
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
        Object.assign(carDiv.style, {
          border: '1px solid #ccc',
          padding: '10px',
          margin: '10px'
        });

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
