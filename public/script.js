// 1. התחברות משתמש
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
  });
}

// 2. הצגת רכבים בעמוד הראשי
document.addEventListener('DOMContentLoaded', async () => {
  const carsList = document.getElementById('cars-list');
  if (!carsList) return; // אם אין רכבים להציג, לא לעשות כלום

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