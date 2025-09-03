const escapeHTML = s => s ? s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : '';
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

    // כפתור הודעות
const inboxBtn = document.createElement('a');
inboxBtn.href = 'messages.html';
inboxBtn.textContent = 'תיבת הודעות';
Object.assign(inboxBtn.style, {
  margin: '10px',
  display: 'block',
  backgroundColor: '#ffea00ff',
  color: '#000000ff',
  border: 'none',
  padding: '8px 27px',
  borderRadius: '5px',
  cursor: 'pointer',
  textDecoration: 'none',
  width: 'fit-content'
});


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
    if (isAdmin) {
  const manageUsers = document.createElement('a');
  manageUsers.href = 'admin-users.html';
  manageUsers.textContent = 'ניהול משתמשים';
  Object.assign(manageUsers.style, {
    margin: '10px',
    display: 'block',
    backgroundColor: '#111827',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
    width: 'fit-content'
  });
  container.appendChild(manageUsers);
}
    container.appendChild(inboxBtn);
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

// ==== דף הודעות (messages.html) ====
const messagesList = document.getElementById('messages-list');
if (messagesList) {
  if (!username) {
    messagesList.innerHTML = '<p>צריך להתחבר כדי לראות הודעות.</p>';
  } else {
    try {
      const [msgsRes, carsRes] = await Promise.all([
        fetch(`/api/messages?username=${encodeURIComponent(username)}`),
        fetch('/api/cars')
      ]);
      const msgs = await msgsRes.json();
      const cars = await carsRes.json();
      const carById = Object.fromEntries(cars.map(c => [c._id, c]));

      messagesList.innerHTML = '';
      if (!Array.isArray(msgs) || msgs.length === 0) {
        messagesList.innerHTML = '<p>אין הודעות עדיין.</p>';
      } else {
        msgs.forEach(m => {
          const card = document.createElement('div');
          card.className = 'msg-card';

          const meta = document.createElement('div');
          meta.className = 'msg-meta';
          const when = new Date(m.createdAt).toLocaleString('he-IL');
          const car = m.car ? carById[m.car] : null;
          meta.textContent = `${m.fromUsername} · ${when}${car ? ` · ${car.manufacturer || ''} ${car.model || ''}` : ''}`;

          const body = document.createElement('div');
          body.className = 'msg-text';
          body.textContent = m.text;

          // פעולות: השב + מחק
          const actions = document.createElement('div');
          actions.className = 'msg-actions';

          const reply = document.createElement('button');
          reply.textContent = 'השב';
          reply.addEventListener('click', async () => {
            const t = prompt('כתוב תשובה...');
            if (!t || !t.trim()) return;
            const resp = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fromUsername: username,
                toUsername: m.fromUsername,
                carId: m.car,
                text: t.trim()
              })
            });
            const d = await resp.json();
            alert(d.message || (resp.ok ? 'נשלח' : 'שגיאה בשליחה'));
          });

          const del = document.createElement('button');
          del.textContent = 'מחק';
          del.className = 'msg-delete';
          del.addEventListener('click', async () => {
            if (!confirm('למחוק את ההודעה?')) return;
            const resp = await fetch(`/api/messages/${m._id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username })
            });
            const d = await resp.json();
            if (!resp.ok) return alert(d.message || 'שגיאה במחיקה.');
            card.remove();
          });

          actions.appendChild(reply);
          actions.appendChild(del);

          card.appendChild(meta);
          card.appendChild(body);
          card.appendChild(actions);
          messagesList.appendChild(card);
        });
      }

      // כפתור חזרה לדף הראשי
      const back = document.createElement('a');
      back.href = 'index.html';
      back.className = 'back-home';
      back.textContent = 'חזור לדף הראשי';
      messagesList.parentElement.appendChild(back);

    } catch (e) {
      console.error(e);
      messagesList.innerHTML = '<p>שגיאה בטעינת ההודעות.</p>';
    }
  }
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


  // כפתור שליחת הודעה למוכר (למשתמשים רשומים בלבד, לא על רכב של עצמם)
if (username && username !== car.ownerUsername) {
  const msgBtn = document.createElement('button');
  msgBtn.textContent = 'שלח הודעה למוכר';
  Object.assign(msgBtn.style, {
    position: 'absolute',  // ← חדש: עוגן לפינה של הכרטיס
    top: '12px',           // ← למעלה
    left: '12px',          // ← לשמאל (אם תרצה בתוך אזור התוכן: נסה 92px)
    zIndex: '2',

    marginTop: '0',
    
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer'
  });

    if (isAdmin) {
      msgBtn.style.left = 'auto';
      msgBtn.style.right = '460px';
  }

  msgBtn.addEventListener('click', async () => {
    const text = prompt('כתוב הודעה למוכר:');
    if (!text || !text.trim()) return;
    const resp = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUsername: username,
        toUsername: car.ownerUsername,
        carId: car._id,
        text: text.trim()
      })
    });
    const data = await resp.json();
    alert(data.message || (resp.ok ? 'הודעה נשלחה' : 'שגיאה בשליחה'));
  });

  card.appendChild(msgBtn);
}



    // === תגובות (מתחת לתיאור) ===
  const commentsWrap = document.createElement('div');
  commentsWrap.className = 'car-comments';

  const commentsList = document.createElement('div');
  commentsList.className = 'comments-list';
  commentsWrap.appendChild(commentsList);

  function renderComments() {
    commentsList.innerHTML = '';
    const list = Array.isArray(car.comments) ? car.comments : [];
    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'comments-empty';
      empty.textContent = 'אין תגובות עדיין.';
      commentsList.appendChild(empty);
      return;
    }

    list.forEach(c => {
      const row = document.createElement('div');
      row.className = 'comment-row';

      const meta = document.createElement('div');
      meta.className = 'meta';
      const when = c.createdAt ? new Date(c.createdAt).toLocaleString('he-IL') : '';
      meta.textContent = `${c.username} · ${when}`;
      row.appendChild(meta);

      const textEl = document.createElement('div');
      textEl.className = 'text';
      textEl.innerHTML = escapeHTML(c.text);
      row.appendChild(textEl);

      if (username && (isAdmin || username === c.username)) {
        const del = document.createElement('button');
        del.className = 'comment-delete';
        del.textContent = 'מחק';
        del.addEventListener('click', async () => {
          if (!confirm('למחוק את התגובה?')) return;
          const resp = await fetch(`/api/cars/${car._id}/comments/${c._id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          const data = await resp.json();
          if (!resp.ok) return alert(data.message || 'שגיאה במחיקת תגובה.');
          // עדכון לוקלי וריענון
          car.comments = (car.comments || []).filter(cc => cc._id !== c._id);
          renderComments();
        });
        row.appendChild(del);
      }

      commentsList.appendChild(row);
    });
  }

  // טופס הוספת תגובה (למשתמשים מחוברים בלבד)
  if (username) {
    const form = document.createElement('div');
    form.className = 'comment-form';

    const ta = document.createElement('textarea');
    ta.placeholder = 'כתוב תגובה...';
    ta.maxLength = 1000;

    const submit = document.createElement('button');
    submit.textContent = 'הגב';
    submit.addEventListener('click', async () => {
      const text = (ta.value || '').trim();
      if (!text) return;
      const resp = await fetch(`/api/cars/${car._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text })
      });
      const data = await resp.json();
      if (!resp.ok) return alert(data.message || 'שגיאה בשליחת תגובה.');
      car.comments = car.comments || [];
      car.comments.push(data.comment);
      ta.value = '';
      renderComments();
    });

    form.appendChild(ta);
    form.appendChild(submit);
    commentsWrap.appendChild(form);
  }

  info.appendChild(commentsWrap);
  renderComments();

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
    card.appendChild(actions);
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