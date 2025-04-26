// script.js - Brag Book Functionality

document.addEventListener('DOMContentLoaded', () => {

    // --- Get Element References ---
    // General
    const themeToggle = document.getElementById('theme-toggle');
    const viewToggle = document.getElementById('view-toggle');
    const mainView = document.getElementById('main-view');
    const analyticsView = document.getElementById('analytics-view');

    // Calendar
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');

    // Daily Brags (Below Calendar)
    const dailyBragsContainer = document.getElementById('daily-brags-container');
    const dailyBragsHeading = document.getElementById('daily-brags-heading');
    const dailyBragsList = document.getElementById('daily-brags-list');

    // Add/Edit Brag Form (Date Specific)
    const addBragForm = document.getElementById('add-brag-form');
    const bragDateInput = document.getElementById('brag-date');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const bragTextInput = document.getElementById('brag-text');
    const editingBragIdInput = document.getElementById('editing-brag-id');
    const submitBragButton = document.getElementById('submit-brag-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');

    // Year Only Brag Form
    const addYearBragForm = document.getElementById('add-year-brag-form');
    const bragYearInput = document.getElementById('brag-year');
    const yearBragTextInput = document.getElementById('year-brag-text');

    // Analytics View
    const analyticsYearInput = document.getElementById('analytics-year');
    const analyticsSearchInput = document.getElementById('analytics-search'); // Search Input
    const loadAnalyticsButton = document.getElementById('load-analytics');
    const analyticsContent = document.getElementById('analytics-content');
    const summaryMax = document.getElementById('summary-max');
    const summaryAvg = document.getElementById('summary-avg');
    const summaryMin = document.getElementById('summary-min');
    const summaryTotal = document.getElementById('summary-total');

    // --- State Variables ---
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = null; // Store selected date in YYYY-MM-DD format
    let brags = JSON.parse(localStorage.getItem('brags')) || []; // Load brags or init empty array
    let debounceTimer; // Timer for debouncing input events

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
            // Switching TO Analytics View
            mainView.classList.remove('active');
            mainView.classList.add('hide'); // Use our new hide class
            
            analyticsView.classList.add('active');
            analyticsView.classList.remove('hide'); // Make sure it's visible
            
            viewToggle.textContent = '🗓️ Calendar';
            analyticsYearInput.value = analyticsYearInput.value || new Date().getFullYear();
            loadAnalytics(); // Load data
            
            // Scroll to top when switching views
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Switching TO Main (Calendar) View
            analyticsView.classList.remove('active');
            analyticsView.classList.add('hide'); // Use our new hide class
            
            mainView.classList.add('active');
            mainView.classList.remove('hide'); // Make sure it's visible
            
            viewToggle.textContent = '📊 Analytics';
            renderCalendar(currentMonth, currentYear);
            renderDailyBrags(selectedDate);
            
            // Scroll to top when switching views
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

            if (dateStr === todayStr) {
                dayCell.classList.add('today');
            }
            if (dateStr === selectedDate) {
                dayCell.classList.add('selected');
            }

            // Check if there's a brag for this date to show indicator dot
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

    // --- Daily Brags Display Logic ---
    const renderDailyBrags = (dateStr) => {
        if (!dateStr) {
            dailyBragsContainer.style.display = 'none'; // Hide if no date selected
            return;
        }

        const bragsForDate = brags.filter(brag => brag.date === dateStr);
        dailyBragsList.innerHTML = ''; // Clear previous list

        if (bragsForDate.length > 0) {
            const dateObj = new Date(dateStr + 'T00:00:00'); // Use T00:00:00 to avoid timezone issues
            dailyBragsHeading.textContent = `Brags for ${dateObj.toLocaleDateString('default', { month: 'long', day: 'numeric' })}`;

            bragsForDate.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Show newest first

            bragsForDate.forEach(brag => {
                const bragItem = document.createElement('div');
                bragItem.classList.add('daily-brag-item', brag.level); // Add level class for border

                const textP = document.createElement('p');
                textP.textContent = brag.text;

                const actionsDiv = document.createElement('div');
                actionsDiv.classList.add('brag-actions');

                // Edit Button
                const editBtn = document.createElement('button');
                editBtn.innerHTML = '✏️';
                editBtn.title = 'Edit this brag';
                editBtn.classList.add('action-button', 'edit-brag');
                editBtn.onclick = () => startEditingBrag(brag.id);

                // Delete Button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = 'Delete this brag';
                deleteBtn.classList.add('action-button', 'delete-brag');
                deleteBtn.onclick = () => {
                     if (confirm('Are you sure you want to delete this brag?')) {
                        deleteBrag(brag.id);
                     }
                };

                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);

                bragItem.appendChild(textP);
                bragItem.appendChild(actionsDiv);
                dailyBragsList.appendChild(bragItem);
            });

            dailyBragsContainer.style.display = 'block'; // Show the card
        } else {
            dailyBragsContainer.style.display = 'none'; // Hide the card if no brags
        }
    };

    // --- Core Brag Functions ---
    const saveBrags = () => {
        localStorage.setItem('brags', JSON.stringify(brags));
    };

    const deleteBrag = (id) => {
        const bragIndex = brags.findIndex(brag => brag.id === id);
        if (bragIndex === -1) return;

        const deletedBragDate = brags[bragIndex].date; // Get date before deleting

        brags = brags.filter(brag => brag.id !== id); // Remove brag from array
        saveBrags();

        // Refresh the necessary views
        if (mainView.classList.contains('active')) {
            renderCalendar(currentMonth, currentYear); // Update calendar dot indicator
            // Re-render daily brags ONLY if the deleted brag was for the currently selected date
            if (deletedBragDate === selectedDate) {
                renderDailyBrags(selectedDate);
            }
        }
        // Also refresh analytics if it's the active view
        if (analyticsView.classList.contains('active')) {
            loadAnalytics();
        }
    };

    const startEditingBrag = (id) => {
        const bragToEdit = brags.find(brag => brag.id === id);
        if (!bragToEdit) return;

        // Select the brag's date if not already selected (this also updates the daily brag view)
        if(bragToEdit.date !== selectedDate) {
            selectDate(bragToEdit.date);
        }

        // Populate the main form
        bragTextInput.value = bragToEdit.text;
        bragDateInput.value = bragToEdit.date;
        document.querySelector(`input[name="brag-level"][value="${bragToEdit.level}"]`).checked = true;
        editingBragIdInput.value = id; // Set the hidden ID

        // Update button text and show cancel button
        submitBragButton.textContent = 'Update Brag';
        cancelEditButton.style.display = 'inline-block';

        // Scroll form into view and focus
        addBragForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        bragTextInput.focus();
    };

    const cancelEditing = () => {
        editingBragIdInput.value = ''; // Clear the editing ID
        addBragForm.reset(); // Reset form fields
        submitBragButton.textContent = 'Add Brag'; // Reset button text
        cancelEditButton.style.display = 'none'; // Hide cancel button

        // Ensure selected date display is correct after reset
        if(selectedDate) {
             const dateObj = new Date(selectedDate + 'T00:00:00');
             selectedDateDisplay.textContent = dateObj.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' });
             bragDateInput.value = selectedDate;
        } else {
             selectedDateDisplay.textContent = 'Select a date';
             bragDateInput.value = '';
        }
    };

    // --- Date Selection ---
    const selectDate = (dateStr) => {
        selectedDate = dateStr;
        bragDateInput.value = dateStr; // Update hidden input for the form
        const dateObj = new Date(dateStr + 'T00:00:00');
        selectedDateDisplay.textContent = dateObj.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' });

        renderCalendar(currentMonth, currentYear); // Re-render calendar for selection highlight/dots
        renderDailyBrags(dateStr); // Render the brags for the newly selected date

        // If user was editing, cancel edit when changing date
        if (editingBragIdInput.value) {
            cancelEditing();
        }
        // Optionally clear the year-only form when a date is selected
        addYearBragForm.reset();
    };


    // --- Form Submit Handlers ---

    // Listener for date-specific Add/Update form
    addBragForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editingId = editingBragIdInput.value;
        const text = bragTextInput.value.trim();
        const levelRadio = document.querySelector('input[name="brag-level"]:checked');
        const date = bragDateInput.value; // Get date from hidden input

        if (!date) {
             alert("Cannot save brag: No date selected.");
             return;
        }
        if (!levelRadio) {
             alert("Cannot save brag: Please select a level (Max/Avg/Min).");
             return;
        }
        const level = levelRadio.value;

        if (text && level) {
            if (editingId) {
                // --- UPDATE existing brag ---
                const bragIndex = brags.findIndex(b => b.id === editingId);
                if (bragIndex > -1) {
                    brags[bragIndex].text = text;
                    brags[bragIndex].level = level;
                    brags[bragIndex].timestamp = new Date().toISOString(); // Update timestamp
                    saveBrags();
                    renderDailyBrags(date); // Re-render the daily list for this date
                    cancelEditing(); // Reset form state
                    // Calendar indicator doesn't need update unless adding/deleting
                } else {
                    console.error("Brag ID not found for editing:", editingId);
                    cancelEditing(); // Reset form anyway
                }
            } else {
                // --- ADD new brag ---
                const newBrag = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    date: date,
                    year: parseInt(date.substring(0, 4)),
                    text,
                    level
                };
                brags.push(newBrag);
                saveBrags();
                renderCalendar(currentMonth, currentYear); // Update calendar dot
                renderDailyBrags(date); // Show the new brag in the daily list
                addBragForm.reset(); // Clear form for next entry
                // Ensure date selection display remains correct after reset
                 const dateObj = new Date(date + 'T00:00:00');
                 selectedDateDisplay.textContent = dateObj.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' });
                 bragDateInput.value = date;
            }
        } else if (!text) {
            alert("Please enter your brag text!");
        }
    });

    // Listener for the Cancel Edit button
    cancelEditButton.addEventListener('click', cancelEditing);

    // Listener for Year-Only Brag form
    addYearBragForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Cancel date-specific editing if active
        if (editingBragIdInput.value) {
            cancelEditing();
        }

        const year = parseInt(bragYearInput.value);
        const text = yearBragTextInput.value.trim();
        const levelRadio = document.querySelector('input[name="year-brag-level"]:checked');

        if (!levelRadio) {
             alert("Please select a level for the year brag.");
             return;
        }
        const level = levelRadio.value;

        if (year && text && level && year > 1900 && year < 2200) {
            const newBrag = {
                 id: Date.now().toString(),
                 timestamp: new Date().toISOString(),
                 date: null, // Explicitly null for year-only
                 year: year,
                 text,
                 level
             };
             brags.push(newBrag);
             saveBrags();
             addYearBragForm.reset();
             // Optionally update analytics if visible and showing the added year
             if (analyticsView.classList.contains('active') && parseInt(analyticsYearInput.value) === year) {
                 loadAnalytics();
             }
        } else if (!year || year <= 1900 || year >= 2200) {
             alert("Please enter a valid year (e.g., 2024).")
        } else if (!text) {
             alert("Please enter the brag text for the year.")
        }
    });


    // --- Analytics Logic ---
    const loadAnalytics = () => {
        const year = parseInt(analyticsYearInput.value);
        const searchTerm = analyticsSearchInput.value.trim().toLowerCase(); // Get search term

        // Initial check for valid year
        if (!year || year <= 1900 || year >= 2200) {
            analyticsContent.innerHTML = `<p class="no-brags">Please enter a valid year (e.g., ${new Date().getFullYear()}).</p>`;
            updateSummary(0, 0, 0);
            return;
        }

        // 1. Filter by year
        let yearBrags = brags.filter(brag => brag.year === year);

        // 2. Filter by search term (if provided)
        if (searchTerm) {
            yearBrags = yearBrags.filter(brag =>
                brag.text.toLowerCase().includes(searchTerm)
            );
        }

        // 3. Sort the filtered results
        yearBrags.sort((a, b) => {
            if (!a.date && b.date) return -1;
            if (a.date && !b.date) return 1;
            if (!a.date && !b.date) return new Date(b.timestamp) - new Date(a.timestamp);
            return new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00');
        });

        analyticsContent.innerHTML = ''; // Clear previous content

        // 4. Categorize and Render
        const categorizedBrags = {
            max: yearBrags.filter(b => b.level === 'max'),
            avg: yearBrags.filter(b => b.level === 'avg'),
            min: yearBrags.filter(b => b.level === 'min')
        };

        let totalCount = 0;

        const createCategorySection = (level, title, icon) => {
            const bragsInCategory = categorizedBrags[level];
            totalCount += bragsInCategory.length; // Count filtered brags

            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('brag-category', level);

            const heading = document.createElement('h3');
            heading.innerHTML = `<span class="icon">${icon}</span> ${title} (${bragsInCategory.length})`;
            categoryDiv.appendChild(heading);

            if (bragsInCategory.length === 0) {
                // No brags in this category (for this year + search filter)
                // Don't add a specific message here, the overall message below handles it
            } else {
                bragsInCategory.forEach(brag => {
                    const bragItem = document.createElement('div');
                    bragItem.classList.add('brag-item'); // Use shared style maybe?

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

                    // Delete Button for Analytics Items
                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('delete-brag');
                    deleteBtn.innerHTML = '&times;';
                    deleteBtn.title = 'Delete this brag';
                    deleteBtn.onclick = () => {
                        if (confirm('Are you sure you want to delete this brag?')) {
                            deleteBrag(brag.id); // deleteBrag will refresh analytics if needed
                        }
                    };

                    bragItem.appendChild(dateSpan);
                    bragItem.appendChild(textP);
                    bragItem.appendChild(deleteBtn);
                    categoryDiv.appendChild(bragItem);
                });
            }
            // Only append category if it has content, or handle empty message within it
             if (bragsInCategory.length > 0) {
                 analyticsContent.appendChild(categoryDiv);
             }
        }; // End createCategorySection

        // Create sections for each category
        createCategorySection('max', 'Max Brags', '✨');
        createCategorySection('avg', 'Average Brags', '😊');
        createCategorySection('min', 'Minor Brags', '👍');

        // Display overall message if NO brags match year + search term
        if(totalCount === 0) {
             const overallNoBragsP = document.createElement('p');
             overallNoBragsP.classList.add('no-brags');
             if (searchTerm) {
                 overallNoBragsP.textContent = `No brags found matching "${analyticsSearchInput.value}" in ${year}.`;
             } else {
                 overallNoBragsP.textContent = `No brags recorded for ${year}. Add some!`;
             }
             analyticsContent.appendChild(overallNoBragsP);
        }

        // Update summary counts based on the *filtered* results shown
        updateSummary(categorizedBrags.max.length, categorizedBrags.avg.length, categorizedBrags.min.length);

    }; // End loadAnalytics

    const updateSummary = (max, avg, min) => {
        summaryMax.textContent = max;
        summaryAvg.textContent = avg;
        summaryMin.textContent = min;
        summaryTotal.textContent = max + avg + min;
    };

    // --- Analytics Event Listeners ---
    loadAnalyticsButton.addEventListener('click', loadAnalytics); // Manual load/refresh

    // Auto-load on year input change (debounced)
    analyticsYearInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadAnalytics, 500);
    });

    // Auto-load on search input change (debounced)
    analyticsSearchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadAnalytics, 300);
    });


    // --- Initial Load ---
    const todayForSelection = new Date();
    const todayStrForSelection = `${todayForSelection.getFullYear()}-${String(todayForSelection.getMonth() + 1).padStart(2, '0')}-${String(todayForSelection.getDate()).padStart(2, '0')}`;
    selectDate(todayStrForSelection); // Select today & render calendar/daily brags
    analyticsYearInput.value = currentYear; // Set default analytics year

    // --- Initial View Setup ---
    // Set initial view states using the hide class
    mainView.classList.add('active');
    mainView.classList.remove('hide');

    analyticsView.classList.remove('active');
    analyticsView.classList.add('hide');


    // --- Calendar Navigation ---
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
        // Clear daily brags when changing month if desired, or keep based on selectedDate
        // renderDailyBrags(null); // Example: Clear daily brags
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
         // renderDailyBrags(null); // Example: Clear daily brags
    });

    // --- PWA Service Worker Registration (Optional - Include if using PWA features) ---
    /*
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js') // Path to your service worker file
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
          });
      });
    }
    */

}); // End DOMContentLoaded