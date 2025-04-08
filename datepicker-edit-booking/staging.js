// Helper function to parse a date string ('YYYY-MM-DD') into a local Date object
function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map((v) => parseInt(v, 10));
  return new Date(year, month - 1, day); // month is 0-based
}

// Helper function to format Date objects to 'YYYY-MM-DD' without time zone issues
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Initialize Easepick date picker after the Wized request completes
window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
  try {
    // Fetch the booking data from the Wized request
    const result = await Wized.requests.waitFor("Fetch_Booking");
    if (!result?.data) {
      throw new Error("Booking data is unavailable in the response.");
    }

    console.log("Fetched Booking Data:", result.data);

    // Extract the minimum length requirement from the booking data
    const minLength = result.data.property.minNights || 1; // Default to 1 if not provided
    console.log(`Minimum number of days required: ${minLength}`);

    // Fetch available dates and prices from the booking data
    if (!result.data.property.dates || !result.data.property.date_object) {
      throw new Error("Date or price data is unavailable in the response.");
    }

    const availableDates = result.data.property.dates.map((dateStr) => parseLocalDate(dateStr));

    const prices = {};
    result.data.property.date_object.forEach((dateObj) => {
      prices[dateObj.date] = dateObj.price; // Map date to price
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ensure comparison is done with the start of the day

    // Initialize Easepick
    const picker = new easepick.create({
      element: "#datepicker",
      css: [
        "https://scripttag.nyc3.digitaloceanspaces.com/6e6958ce-3345-49b2-b0de-25483a9cca8a",
        "https://api.statechange.ai/api:scripttagme/dev/Easepick_13dff193-b494-44ce-a31c-40d8b99e6a4a",
      ],
      inline: true,
      zIndex: 10,
      plugins: ["AmpPlugin", "RangePlugin", "LockPlugin"],
      LockPlugin: {
        minDate: today, // Disable past dates
        filter(date, picked) {
          // Lock dates that are not in the availableDates array
          return !availableDates.some(
            (availableDate) => availableDate.getTime() === date.getTime()
          );
        },
      },
      setup(picker) {
        // Set initial dates on load if available
        if (result.data.arrival_date && result.data.departure_date) {
          const initialStartDate = parseLocalDate(result.data.arrival_date);
          const initialEndDate = parseLocalDate(result.data.departure_date);

          console.log(
            `Setting initial selection: Start - ${result.data.arrival_date}, End - ${result.data.departure_date}`
          );

          picker.setStartDate(initialStartDate);
          picker.setEndDate(initialEndDate);
        }

        picker.on("select", () => {
          const startDate = picker.getStartDate();
          const endDate = picker.getEndDate();

          if (startDate && endDate) {
            const arrivalDateStr = formatDate(startDate);
            const departureDateStr = formatDate(endDate);

            // Set Wized variables for arrival and departure dates
            Wized.data.v.arrival_date = arrivalDateStr;
            Wized.data.v.departure_date = departureDateStr;

            // Calculate the number of days in the range
            const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
            const selectedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days

            // Enforce minimum length
            if (selectedDays < minLength) {
              console.error(
                `Invalid selection: Selected range (${selectedDays} days) is less than the minimum required (${minLength} days).`
              );

              // Adjust the end date to meet the minimum length requirement
              const adjustedEndDate = new Date(
                startDate.getTime() + (minLength - 1) * 24 * 60 * 60 * 1000
              );
              picker.setEndDate(adjustedEndDate);

              alert(`You must select at least ${minLength} days. Adjusting your selection.`);

              return;
            }
          }
        });

        picker.on("view", (evt) => {
          const { view, date, target } = evt.detail;
          const formattedDate = date ? formatDate(date) : null;

          // Do not show price for past dates
          if (date < today) {
            return; // Skip rendering price for past dates
          }

          // Display price for each day
          if (view === "CalendarDay" && prices[formattedDate]) {
            const span = target.querySelector(".day-price") || document.createElement("span");
            span.className = "day-price";
            span.innerHTML = `$${prices[formattedDate]}`; // Add price to the day
            target.append(span);
          }

          // Hide prices for locked days
          if (target.classList.contains("locked")) {
            const priceElement = target.querySelector(".day-price");
            if (priceElement) {
              priceElement.style.display = "none";
            }
            target.style.setProperty("background-color", "transparent", "important");
          }
        });
      },
    });
  } catch (error) {
    console.error("Error initializing date picker:", error);
  }
});
