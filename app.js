// --- Clave para el Almacenamiento Local ---
const STORAGE_KEY = 'miGestorTickets';

// --- ESTADO DE LA APLICACIÓN ---
let allTickets = [];
let currentDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

// --- ELEMENTOS DEL DOM ---
const ticketsListEl = document.getElementById('tickets-list');
const loadingState = document.getElementById('loading-state');
const ticketsListTitle = document.getElementById('tickets-list-title');
const calendarGrid = document.getElementById('calendar-grid');
const monthYearEl = document.getElementById('month-year');
const addTicketForm = document.getElementById('add-ticket-form');
const userIdDisplay = document.getElementById('user-id-display');

// --- LÓGICA DE DATOS LOCALES (CACHE) ---

/**
 * Carga los tickets desde el localStorage del navegador.
 * @returns {Array} Un array de objetos de ticket.
 */
const loadTicketsFromCache = () => {
    const ticketsJSON = localStorage.getItem(STORAGE_KEY);
    return ticketsJSON ? JSON.parse(ticketsJSON) : [];
};

/**
 * Guarda el array de tickets en el localStorage del navegador.
 * @param {Array} tickets - El array de tickets a guardar.
 */
const saveTicketsToCache = (tickets) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
};

// --- LÓGICA DEL CALENDARIO ---
const renderCalendar = () => {
    currentDate.setDate(1);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    monthYearEl.textContent = `${currentDate.toLocaleString('es-ES', { month: 'long' })} ${year}`;
    
    const firstDayIndex = (currentDate.getDay() + 6) % 7;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();
    
    while (calendarGrid.children.length > 7) {
        calendarGrid.removeChild(calendarGrid.lastChild);
    }

    for (let i = firstDayIndex; i > 0; i--) {
        const dayEl = document.createElement('div');
        dayEl.textContent = prevLastDay - i + 1;
        dayEl.className = 'text-gray-600 p-2';
        calendarGrid.appendChild(dayEl);
    }

    const ticketDates = new Set(allTickets.map(t => t.date));

    for (let i = 1; i <= lastDay; i++) {
        const dayEl = document.createElement('button');
        dayEl.textContent = i;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dayEl.dataset.date = dateStr;
        dayEl.className = 'calendar-day relative p-2 rounded-full hover:bg-gray-700 transition cursor-pointer';

        if (dateStr === selectedDate) {
            dayEl.classList.add('selected');
        }
        if(ticketDates.has(dateStr)) {
            dayEl.classList.add('has-tickets');
        }
        
        dayEl.addEventListener('click', () => {
            selectedDate = dateStr;
            document.getElementById('ticket-date').value = selectedDate;
            renderFilteredTickets();
            renderCalendar();
        });
        calendarGrid.appendChild(dayEl);
    }
};

document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// --- RENDERIZADO DE TICKETS ---
const getStatusBadge = (status) => {
     switch(status) {
         case 'Desarrollo': return `<span class="bg-blue-900 text-blue-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${status}</span>`;
         case 'CEO': return `<span class="bg-purple-900 text-purple-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${status}</span>`;
         case 'Payments Way': return `<span class="bg-yellow-900 text-yellow-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${status}</span>`;
         case 'Finalizado': return `<span class="bg-green-900 text-green-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${status}</span>`;
         case 'Soporte N1': return `<span class="bg-gray-700 text-gray-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${status}</span>`;
         default: return `<span class="bg-gray-700 text-gray-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${status}</span>`;
    }
};

const renderFilteredTickets = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    ticketsListTitle.textContent = `Tickets para el ${dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    const filteredTickets = allTickets
        .filter(ticket => ticket.date === selectedDate)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    renderTickets(filteredTickets);
};

const renderTickets = (tickets) => {
    ticketsListEl.innerHTML = '';
    if (tickets.length === 0) {
        ticketsListEl.innerHTML = `<div class="text-center py-10 bg-gray-800 rounded-xl"><p class="text-gray-400">No hay tickets para esta fecha.</p></div>`;
        return;
    }

    tickets.forEach(ticket => {
        const ticketEl = document.createElement('div');
        ticketEl.className = 'bg-gray-800 p-5 rounded-xl shadow-md ticket-card flex flex-col md:flex-row gap-4';
        ticketEl.setAttribute('data-id', ticket.id);

        const formattedDate = new Date(ticket.createdAt).toLocaleString('es-ES');

        ticketEl.innerHTML = `
            <div class="flex-grow">
                <div class="flex justify-between items-start">
                     <h3 class="text-lg font-bold text-cyan-400 mb-2">${escapeHTML(ticket.ticketId)}</h3>
                     ${getStatusBadge(ticket.status)}
                </div>
                <p class="text-gray-300 whitespace-pre-wrap">${escapeHTML(ticket.response)}</p>
                <p class="text-xs text-gray-500 mt-3">Registrado: ${formattedDate}</p>
            </div>
            <div class="flex flex-row md:flex-col items-center justify-end md:justify-start gap-2 flex-shrink-0">
                <button class="edit-btn bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition" title="Editar Ticket"><i class="ph ph-pencil-simple"></i></button>
                <button class="delete-btn bg-red-800 hover:bg-red-700 text-white p-2 rounded-full transition" title="Eliminar Ticket"><i class="ph ph-trash"></i></button>
            </div>
        `;
        ticketsListEl.appendChild(ticketEl);
    });
};

const escapeHTML = str => str ? str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)) : '';

// --- LÓGICA DE MANEJO DE DATOS ---

const refreshUI = () => {
    allTickets = loadTicketsFromCache();
    loadingState.classList.add('hidden');
    renderCalendar();
    renderFilteredTickets();
};

addTicketForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTicket = {
        // Creamos un ID único basado en la fecha actual en milisegundos
        id: Date.now().toString(), 
        date: document.getElementById('ticket-date').value,
        ticketId: document.getElementById('ticket-id').value,
        status: document.getElementById('ticket-status').value,
        response: document.getElementById('ticket-response').value,
        // Usamos una fecha estándar ISO en lugar de un objeto de Firebase
        createdAt: new Date().toISOString()
    };
    
    allTickets.push(newTicket);
    saveTicketsToCache(allTickets);
    
    addTicketForm.reset();
    document.getElementById('ticket-date').value = selectedDate;
    refreshUI();
});

ticketsListEl.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const ticketEl = target.closest('.ticket-card');
    const ticketId = ticketEl.getAttribute('data-id');
    const ticketData = allTickets.find(t => t.id === ticketId);

    if (target.classList.contains('delete-btn')) {
        if (confirm('¿Estás seguro de que quieres eliminar este ticket?')) {
            allTickets = allTickets.filter(t => t.id !== ticketId);
            saveTicketsToCache(allTickets);
            refreshUI();
        }
    } else if (target.classList.contains('edit-btn')) {
        openEditModal(ticketId, ticketData);
    }
});

// --- LÓGICA DEL MODAL DE EDICIÓN ---
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-ticket-form');
const cancelEditBtn = document.getElementById('cancel-edit');

const openEditModal = (ticketId, data) => {
    editForm.elements['edit-doc-id'].value = ticketId;
    editForm.elements['edit-ticket-date'].value = data.date;
    editForm.elements['edit-ticket-id'].value = data.ticketId;
    editForm.elements['edit-ticket-status'].value = data.status;
    editForm.elements['edit-ticket-response'].value = data.response;
    editModal.classList.remove('hidden');
}

const closeEditModal = () => editModal.classList.add('hidden');
cancelEditBtn.addEventListener('click', closeEditModal);

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ticketId = editForm.elements['edit-doc-id'].value;
    
    const ticketIndex = allTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex > -1) {
        allTickets[ticketIndex] = {
            ...allTickets[ticketIndex], // Mantiene el id y createdAt original
            date: editForm.elements['edit-ticket-date'].value,
            ticketId: editForm.elements['edit-ticket-id'].value,
            status: editForm.elements['edit-ticket-status'].value,
            response: editForm.elements['edit-ticket-response'].value,
        };
        saveTicketsToCache(allTickets);
        closeEditModal();
        refreshUI();
    }
});

// --- INICIALIZACIÓN DE LA APP ---
const initializeApp = () => {
    userIdDisplay.textContent = 'Modo Local (sin conexión)';
    document.getElementById('ticket-date').value = selectedDate;
    refreshUI();
};

initializeApp();