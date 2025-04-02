// Utility Functions
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePSTDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Create a PST date without time information
  return new Date(year, month - 1, day).getTime();
}

// Precompute constants
const MS_IN_DAY = 86400000;

// Preprocess dates into a Map for O(1) lookups
function createDateMap(dates) {
  const map = new Map();
  for (let i = 0; i < dates.length; i++) {
    map.set(dates[i].date, dates[i]);
  }
  return map;
}

// Find Available Date Range Optimized
function findAvailableDateRange(dates, months, dateMap) {
  const today = Wized.data.v.ltr_start_date
    ? parsePSTDate(Wized.data.v.ltr_start_date)
    : Date.now();

  const daysInMonths = months * 30; // Approximate days
  let startDate = null;
  let endDate = null;
  let isRangeValid = true;

  for (let i = 0; i < dates.length; i++) {
    const dateObj = dates[i];
    const startTimestamp = parsePSTDate(dateObj.date);

    if (startTimestamp < today) continue;
    if (!(dateObj.available || dateObj.check_in_available)) continue;

    // Check one additional day to ensure full range
    for (let j = 0; j <= daysInMonths; j++) {
      const checkTimestamp = startTimestamp + j * MS_IN_DAY;
      const checkDate = new Date(checkTimestamp);
      const formattedCheckDate = formatDate(checkDate);
      const checkDateObj = dateMap.get(formattedCheckDate);

      if (!checkDateObj) {
        isRangeValid = false;
        break;
      }

      if (j === 0) {
        if (!(checkDateObj.available || checkDateObj.check_in_available)) {
          isRangeValid = false;
          break;
        }
      } else if (j === daysInMonths) {
        if (!(checkDateObj.available || checkDateObj.check_out_available)) {
          isRangeValid = false;
          break;
        }
      } else {
        if (!checkDateObj.available) {
          isRangeValid = false;
          break;
        }
      }
    }

    if (isRangeValid) {
      startDate = formatDate(new Date(startTimestamp));
      const endTimestamp = startTimestamp + daysInMonths * MS_IN_DAY;
      endDate = formatDate(new Date(endTimestamp));
      break;
    }
  }

  Wized.data.v.invalidRange = isRangeValid;

  return { startDate, endDate };
}

// Attach Date to Picker
function attachDateToPicker(start, end) {
  if (window.picker) {
    const [startYear, startMonth, startDay] = start.split("-").map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);

    const [endYear, endMonth, endDay] = end.split("-").map(Number);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    // Explicitly set the start and end dates
    window.picker.setStartDate(startDate);
    window.picker.setEndDate(endDate);

    // Navigate the picker to the start date's month
    window.picker.gotoDate(startDate);
  } else {
    console.warn("Picker is not initialized.");
  }
}

// Debounce Function to Prevent Rapid Clicks
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Attach Click Listener to Buttons with Debounced Handler
function setupClickListeners(dates, dateMap) {
  const buttons = document.querySelectorAll(
    '[wized="ltr_6_Months"], [wized="ltr_12_Months"], [wized="ltr_18_Months"]'
  );

  // Precompute the months value for each button to avoid recalculating
  const buttonMonthsMap = new Map();
  buttons.forEach((button) => {
    const wizedVal = button.getAttribute("wized");
    let months = 0;
    if (wizedVal === "ltr_6_Months") months = 6;
    else if (wizedVal === "ltr_12_Months") months = 12;
    else if (wizedVal === "ltr_18_Months") months = 18;
    buttonMonthsMap.set(button, months);
  });

  // Debounced click handler
  const handleClick = debounce((button, months) => {
    Wized.data.v.invalidRange = false;
    // Remove 'is-blue' class from all buttons to reset
    buttons.forEach((btn) => btn.classList.remove("is-blue"));

    // Add 'is-blue' class to the selected button
    button.classList.add("is-blue");

    const availableRange = findAvailableDateRange(dates, months, dateMap);

    if (availableRange.startDate && availableRange.endDate) {
      attachDateToPicker(availableRange.startDate, availableRange.endDate);
      // Sync to Wized variables

      Wized.data.v.arrival_date = availableRange.startDate;
      Wized.data.v.departure_date = availableRange.endDate;
    } else {
      console.warn("No available date range found.");
    }
  }, 300); // 300ms delay; adjust as needed

  buttons.forEach((button) => {
    const months = buttonMonthsMap.get(button);
    button.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        handleClick(button, months);
      },
      false
    );
  });
}

// Initialize Button States
function initializeButtonStates(dates, dateMap) {
  const buttons = document.querySelectorAll(
    '[wized="ltr_6_Months"], [wized="ltr_12_Months"], [wized="ltr_18_Months"]'
  );

  // Precompute the months value for each button
  const buttonMonthsMap = new Map();
  buttons.forEach((button) => {
    const wizedVal = button.getAttribute("wized");
    let months = 0;
    if (wizedVal === "ltr_6_Months") months = 6;
    else if (wizedVal === "ltr_12_Months") months = 12;
    else if (wizedVal === "ltr_18_Months") months = 18;
    buttonMonthsMap.set(button, months);
  });

  // Batch processing to prevent blocking the main thread
  const batchSize = 1000; // Adjust based on performance
  let index = 0;

  function processBatch() {
    const end = Math.min(index + batchSize, buttons.length);
    for (; index < end; index++) {
      const button = buttons[index];
      const months = buttonMonthsMap.get(button);
      const availableRange = findAvailableDateRange(dates, months, dateMap);
      if (!availableRange.startDate || !availableRange.endDate) {
        button.classList.add("is-dark");
        button.classList.remove("is-blue"); // Ensure 'is-blue' is removed if disabled
        button.style.pointerEvents = "none";
        button.style.display = "none";
      } else {
        button.style.display = "flex";
        button.classList.remove("is-dark");
        button.style.pointerEvents = "";
      }
    }

    if (index < buttons.length) {
      requestAnimationFrame(processBatch);
    }
  }

  requestAnimationFrame(processBatch);
}

// Main Initialization
window.Wized.push(async (Wized) => {
  try {
    const result = await Wized.requests.waitFor("Get_Property_Dates");
    if (result && result.data && Array.isArray(result.data.date_object)) {
      const dates = result.data.date_object;
      const dateMap = createDateMap(dates);
      initializeButtonStates(dates, dateMap);
      setupClickListeners(dates, dateMap);
    } else {
      console.error("Invalid data structure for dates.");
    }
  } catch (error) {
    console.error("Error fetching property dates:", error);
  }
});
