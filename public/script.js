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
  const isAdmin = username === 'admin';

  if (username) {
    
    // יצירת קונטיינר לימין עליון
    const container = document.createElement('div');

    // ברכה
    const greeting = document.createElement('div');
    greeting.innerHTML = `היי, ${username}<br>ברוך הבא!<br>`;
    greeting.style.textAlign = 'right';
    greeting.style.padding = '10px';
    greeting.style.fontWeight = 'bold';

    // כפתור העלאת רכב
    const addCarBtn = document.createElement('a');
    addCarBtn.href = 'add-car.html';
    addCarBtn.textContent = 'העלה רכב למכירה';
    Object.assign(addCarBtn.style, {
      margin: '10px',
      display: 'block',
      backgroundColor: '#3498db',
      color: '#fff',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      cursor: 'pointer',
      textDecoration: 'none',
      width: 'fit-content'
    });

        // כפתור התנתקות
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'התנתק';
    Object.assign(logoutBtn.style, {
      margin: '10px',
      display: 'block',
      backgroundColor: '#e74c3c',
      color: '#fff',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      cursor: 'pointer'
    });

    // הוספה לדף
    container.appendChild(greeting);
    container.appendChild(addCarBtn);
    container.appendChild(logoutBtn);

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
  // === כרטיס בסיסי ===
  const card = document.createElement('article');
  card.className = 'car-card';

  // נתוני בעלים (נפילות חן לרכבים ישנים)
  const ownerName  = car.ownerName || car.ownerUsername || '—';
  const ownerPhone = car.ownerPhone || '—';

  // === תמונה מימין ===
  const media = document.createElement('div');
  media.className = 'car-media';

  if (car.imageUrl) {
    const src = car.imageUrl.startsWith('http')
      ? car.imageUrl
      : `${window.location.origin}${car.imageUrl}`;
    const img = document.createElement('img');
    img.className = 'car-card-image';
    img.loading = 'lazy';
    img.alt = `${car.manufacturer || ''} ${car.model || ''}`.trim();
    img.src = `${src}?v=${encodeURIComponent(car._id || Date.now())}`; // עוקף קאש
    media.appendChild(img);
  } else {
    const noImg = document.createElement('div');
    noImg.className = 'car-no-image';
    noImg.textContent = 'אין תמונה';
    media.appendChild(noImg);
  }

  // === טקסט משמאל ===
  const info = document.createElement('div');
  info.className = 'car-info';
  info.innerHTML = `
    <h3 class="car-title">${car.manufacturer || ''} ${car.model || ''}</h3>
    <p class="car-meta"><span><strong>שנה:</strong> ${car.year ?? '—'}</span></p>
    <p class="car-desc"><strong>תיאור:</strong> ${car.description || '—'}</p>
    <p class="car-owner"><strong>מעלה:</strong> ${ownerName} &middot; <strong>טלפון:</strong> ${ownerPhone}</p>
  `;

  // === פעולות לבעל הרכב בלבד ===
  if (username && (isAdmin || username === car.ownerUsername)) {
    const actions = document.createElement('div');
    actions.className = 'car-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'ערוך';
    editBtn.addEventListener('click', async () => {
      const manufacturer = prompt('יצרן:', car.manufacturer) ?? car.manufacturer;
      const model        = prompt('דגם:', car.model) ?? car.model;
      const year         = Number(prompt('שנה:', car.year)) || car.year;
      const description  = prompt('תיאור:', car.description) ?? car.description;

      const res = await fetch(`/api/cars/${car._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manufacturer, model, year, description, username })
      });
      const data = await res.json();
      alert(data.message);
      location.reload();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'מחק';
    deleteBtn.className = 'delete';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('למחוק את הרכב?')) return;
      const res = await fetch(`/api/cars/${car._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      alert(data.message);
      location.reload();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    info.appendChild(actions);
  }

  // סדר הילדים חשוב: ב-RTL הראשון יוצג מימין
  card.appendChild(media); // מימין
  card.appendChild(info);  // משמאל

  // הוספה לרשימה
  carsList.appendChild(card);
});
    }
  } catch (error) {
    carsList.innerHTML = '<p>שגיאה בטעינת הרכבים.</p>';
    console.error(error);
  }
});