document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const addBragForm = document.getElementById('add-brag-form');
    const bragDateInput = document.getElementById('brag-date');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const bragTextInput = document.getElementById('brag-text');
    const addYearBragForm = document.getElementById('add-year-brag-form');
    const bragYearInput = document.getElementById('brag-year');
    const yearBragTextInput = document.getElementById('year-brag-text');

    const viewToggle = document.getElementById('view-toggle');
    const mainView = document.getElementById('main-view');
    const analyticsView = document.getElementById('analytics-view');
    const analyticsYearInput = document.getElementById('analytics-year');
    const loadAnalyticsButton = document.getElementById('load-analytics');
    const analyticsContent = document.getElementById('analytics-content');
    const summaryMax = document.getElementById('summary-max');
    const summaryAvg = document.getElementById('summary-avg');
    const summaryMin = document.getElementById('summary-min');
    const summaryTotal = document.getElementById('summary-total');


    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = null; // Store selected date in YYYY-MM-DD format
    let brags = JSON.parse(localStorage.getItem('brags')) || []; // Load brags or init empty array

    // --- Theme Handling ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            themeToggle.textContent = '🌙';
        }
    };

    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- View Switching ---
    viewToggle.addEventListener('click', () => {
        if (mainView.classList.contains('active')) {
            // Switch to analytics view
            mainView.classList.remove('active');
            mainView.style.display = 'none'; // Immediately hide main view
            
            analyticsView.style.display = 'block'; // Show analytics view
            analyticsView.classList.add('active');
            
            viewToggle.textContent = '🗓️ Calendar';
            // Pre-fill analytics year and load
            analyticsYearInput.value = analyticsYearInput.value || new Date().getFullYear();
            loadAnalytics();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Switch to main view
            analyticsView.classList.remove('active');
            analyticsView.style.display = 'none'; // Immediately hide analytics view
            
            mainView.style.display = 'grid'; // Show main view with grid layout
            mainView.classList.add('active');
            
            viewToggle.textContent = '📊 Analytics';
            // Refresh calendar indicators when switching back
            renderCalendar(currentMonth, currentYear);
        }
    });

    // --- Calendar Logic ---
    const renderCalendar = (month, year) => {
        calendarGrid.innerHTML = ''; // Clear previous grid
        monthYearDisplay.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add weekday headers
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const weekdayCell = document.createElement('div');
            weekdayCell.classList.add('calendar-weekday');
            weekdayCell.textContent = day;
            calendarGrid.appendChild(weekdayCell);
        });

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyCell);
        }

        // Add day cells
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;

            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('today');
            }

            if (dateStr === selectedDate) {
                dayCell.classList.add('selected');
            }

            // Check if there's a brag for this date
            if (brags.some(brag => brag.date === dateStr)) {
                 const bragIndicator = document.createElement('span');
                 bragIndicator.classList.add('brag-indicator');
                 dayCell.appendChild(bragIndicator);
            }


            dayCell.addEventListener('click', () => {
                selectDate(dateStr);
            });
            calendarGrid.appendChild(dayCell);
        }
    };

    const selectDate = (dateStr) => {
        selectedDate = dateStr;
        bragDateInput.value = dateStr; // Update hidden input for the form
        const dateObj = new Date(dateStr + 'T00:00:00'); // Ensure correct date parsing
        selectedDateDisplay.textContent = dateObj.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' });
        // Re-render to show selection highlight
        renderCalendar(currentMonth, currentYear);
        // Optionally clear the year-only form when a date is selected
        addYearBragForm.reset();
    };

    // --- Brag Handling ---
    const saveBrags = () => {
        localStorage.setItem('brags', JSON.stringify(brags));
    };

    const addBrag = (bragData) => {
        const newBrag = {
            id: Date.now().toString(), // Simple unique ID
            timestamp: new Date().toISOString(),
            ...bragData // Merge date/year, text, level
        };
        brags.push(newBrag);
        saveBrags();
        renderCalendar(currentMonth, currentYear); // Re-render calendar to show indicator
        // Optionally, clear the form and selection
        addBragForm.reset();
        yearBragTextInput.value = ''; // Clear textarea specifically if needed
        selectDate(selectedDate); // Keep date selected but maybe clear text
        bragTextInput.value = '';
    };

    // Event listener for date-specific brag form
    addBragForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!selectedDate) {
            alert("Please select a date on the calendar first!");
            return;
        }
        const text = bragTextInput.value.trim();
        const level = document.querySelector('input[name="brag-level"]:checked').value;

        if (text && level) {
            addBrag({ date: selectedDate, year: parseInt(selectedDate.substring(0, 4)), text, level });
            // Optional: Give user feedback (e.g., a subtle animation or message)
        }
    });

    // Event listener for year-only brag form
    addYearBragForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const year = parseInt(bragYearInput.value);
        const text = yearBragTextInput.value.trim();
        const level = document.querySelector('input[name="year-brag-level"]:checked').value;

        if (year && text && level && year > 1900 && year < 2200) { // Basic year validation
            addBrag({ date: null, year: year, text, level });
            addYearBragForm.reset(); // Reset this specific form
            // Optional: Give user feedback
        } else {
            alert("Please enter a valid year and brag text.");
        }
    });

     // Function to delete a brag
    const deleteBrag = (id) => {
        brags = brags.filter(brag => brag.id !== id);
        saveBrags();
        // Refresh the current view (either calendar or analytics)
        if (mainView.classList.contains('active')) {
            renderCalendar(currentMonth, currentYear);
        } else {
            loadAnalytics(); // Reload analytics for the current year
        }
    };


    // --- Analytics Logic ---
    const loadAnalytics = () => {
        const year = parseInt(analyticsYearInput.value);
        if (!year) {
            analyticsContent.innerHTML = '<p class="no-brags">Please enter a valid year.</p>';
            updateSummary(0, 0, 0);
            return;
        }

        const yearBrags = brags.filter(brag => brag.year === year);
        yearBrags.sort((a, b) => {
            // Sort by date (year-only brags first, then by date)
            if (!a.date && b.date) return -1;
            if (a.date && !b.date) return 1;
            if (!a.date && !b.date) return new Date(b.timestamp) - new Date(a.timestamp); // Sort year-only by time added
            return new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00');
        });


        analyticsContent.innerHTML = ''; // Clear previous content

        const categorizedBrags = {
            max: yearBrags.filter(b => b.level === 'max'),
            avg: yearBrags.filter(b => b.level === 'avg'),
            min: yearBrags.filter(b => b.level === 'min')
        };

        let totalCount = 0;

        const createCategorySection = (level, title, icon) => {
            const bragsInCategory = categorizedBrags[level];
            totalCount += bragsInCategory.length;

            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('brag-category', level);

            const heading = document.createElement('h3');
            heading.innerHTML = `<span class="icon">${icon}</span> ${title} (${bragsInCategory.length})`;
            categoryDiv.appendChild(heading);

            if (bragsInCategory.length === 0) {
                const noBragsP = document.createElement('p');
                noBragsP.classList.add('no-brags');
                noBragsP.textContent = `No ${title.toLowerCase()} brags for ${year}.`;
                categoryDiv.appendChild(noBragsP);
            } else {
                bragsInCategory.forEach(brag => {
                    const bragItem = document.createElement('div');
                    bragItem.classList.add('brag-item');

                    const dateSpan = document.createElement('span');
                    dateSpan.classList.add('date');
                    if (brag.date) {
                         const dateObj = new Date(brag.date + 'T00:00:00');
                         dateSpan.textContent = dateObj.toLocaleDateString('default', { month: 'long', day: 'numeric' });
                    } else {
                        dateSpan.textContent = `${brag.year} (Year Only)`;
                    }

                    const textP = document.createElement('p');
                    textP.textContent = brag.text;

                     // Delete Button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('delete-brag');
                    deleteBtn.innerHTML = '&times;'; // Multiplication sign as 'X'
                    deleteBtn.title = 'Delete this brag';
                    deleteBtn.onclick = () => deleteBrag(brag.id);


                    bragItem.appendChild(dateSpan);
                    bragItem.appendChild(textP);
                    bragItem.appendChild(deleteBtn);
                    categoryDiv.appendChild(bragItem);
                });
            }
            analyticsContent.appendChild(categoryDiv);
        };

        if(yearBrags.length === 0) {
             analyticsContent.innerHTML = `<p class="no-brags">No brags recorded for ${year}.</p>`;
        } else {
            createCategorySection('max', 'Max Brags', '✨');
            createCategorySection('avg', 'Average Brags', '😊');
            createCategorySection('min', 'Minor Brags', '👍');
        }

        // Update summary counts
        updateSummary(categorizedBrags.max.length, categorizedBrags.avg.length, categorizedBrags.min.length);

    };

    const updateSummary = (max, avg, min) => {
        summaryMax.textContent = max;
        summaryAvg.textContent = avg;
        summaryMin.textContent = min;
        summaryTotal.textContent = max + avg + min;
    }

    loadAnalyticsButton.addEventListener('click', loadAnalytics);
    // Optional: Load analytics on year input change after a small delay (debounce)
    let debounceTimer;
    analyticsYearInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadAnalytics, 500); // Load 500ms after user stops typing
    });


    // --- Initial Load ---
    const todayForSelection = new Date();
    const todayStrForSelection = `${todayForSelection.getFullYear()}-${String(todayForSelection.getMonth() + 1).padStart(2, '0')}-${String(todayForSelection.getDate()).padStart(2, '0')}`;
    selectDate(todayStrForSelection); // Select today's date by default
    renderCalendar(currentMonth, currentYear);
    analyticsYearInput.value = currentYear; // Set default analytics year

    // Calendar navigation
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

}); // End DOMContentLoaded