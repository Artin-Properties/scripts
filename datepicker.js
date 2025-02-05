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
    const result = await Wized.requests.waitFor("Get_Property_Dates"); // Wait for the request to complete

    if (result && result.data && result.data.date_object) {
      const prices = {}; // Map date to price based on date_object array
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of the day for accurate comparison

      // Loop through date_object to set prices and filter by availability
      result.data.date_object.forEach((dateObj) => {
        const dateStr = dateObj.date;
        const parts = dateStr.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);

        if (
          date >= today &&
          (dateObj.available ||
            dateObj.check_in_available ||
            dateObj.check_out_available)
        ) {
          const formattedDate = formatDate(date);
          prices[formattedDate] = dateObj.price;
        }
      });

      picker = new easepick.create({
        element: "#datepicker",
        css: [
          "https://scripttag.nyc3.digitaloceanspaces.com/6e6958ce-3345-49b2-b0de-25483a9cca8a", // Replace with your CSS URL
          "https://api.statechange.ai/api:scripttagme/dev/Easepick_13dff193-b494-44ce-a31c-40d8b99e6a4a",
        ],
        inline: true,
        zIndex: 10,
        plugins: ["AmpPlugin", "RangePlugin", "LockPlugin"],
        RangePlugin: {
          tooltip: true,
          tooltipNumber(num) {
            return num - 1;
          }
        },
        LockPlugin: {
          minDate: new Date(),
          filter(date, picked) {
            const formattedDate = date.format("YYYY-MM-DD");
            const dateObj = result.data.date_object.find(
              (obj) => obj.date === formattedDate
            );
            if (!dateObj) {
              return false;
            }
            const isAvailable = dateObj.available;
            const isAvailableForCheckIn = dateObj.check_in_available;
            const isAvailableForCheckOut = dateObj.check_out_available;
            return !(
              isAvailable ||
              isAvailableForCheckIn ||
              isAvailableForCheckOut
            );
          },
        },

        setup(picker) {
          let lastEndDate = null;

          picker.on("select", () => {
            const startDate = picker.getStartDate();
            const endDate = picker.getEndDate();
            console.log(startDate, endDate);

            if (startDate && endDate) {
              const arrivalDateStr = startDate.format("YYYY-MM-DD");
              const departureDateStr = endDate.format("YYYY-MM-DD");

              const arrivalDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
              );
              const departureDate = new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
              );

              let isInvalidRange = false;
              const selectedDates = [];
              let currentDate = new Date(arrivalDate);

              while (currentDate <= departureDate) {
                const formattedDate = formatDate(currentDate);
                selectedDates.push(formattedDate);
                currentDate.setDate(currentDate.getDate() + 1);
              }
              console.log(selectedDates);
              const [...leadingdates] = selectedDates;
              const checkoutdate = leadingdates.pop();

              for (let date of leadingdates) {
                const dateObj = result.data.date_object.find(
                  (obj) => obj.date === date
                );

                // Log the date and its availability status
                if (dateObj) {
                  console.log(
                    `Date: ${date}, available: ${dateObj.available}, check_in_available: ${dateObj.check_in_available}, check_out_available: ${dateObj.check_out_available}`
                  );
                } else {
                  console.log(`Date: ${date}, no data found`);
                }

                if (!dateObj.check_in_available && !dateObj.available) {
                  isInvalidRange = true;
                  break;
                }
              }
              const dateObj = result.data.date_object.find(
                (obj) => obj.date === checkoutdate
              );

              if (!dateObj.check_out_available && !dateObj.available) {
                isInvalidRange = true;
              }

              // Log whether the selected range is invalid
              console.log("Is Invalid Range:", isInvalidRange);

              if (isInvalidRange) {
                picker.setStartDate(endDate);
                picker.setEndDate(endDate);
                Wized.data.v.arrival_date = departureDateStr;
                Wized.data.v.departure_date = departureDateStr;
              } else {
                Wized.data.v.arrival_date = arrivalDateStr;
                Wized.data.v.departure_date = departureDateStr;
                lastEndDate = endDate;
              }
            }
          });

          picker.on("view", (evt) => {
            const { view, date, target } = evt.detail;
            const formattedDate = date ? date.format("YYYY-MM-DD") : null;

            if (view === "CalendarDay" && prices[formattedDate]) {
              const span =
                target.querySelector(".day-price") ||
                document.createElement("span");
              span.className = "day-price";
              span.innerHTML = `$${prices[formattedDate]}`;
              target.append(span);

              if (target.classList.contains("locked")) {
                const priceElement = target.querySelector(".day-price");
                if (priceElement) {
                  priceElement.style.display = "none";
                }
                target.style.setProperty(
                  "background-color",
                  "transparent",
                  "important"
                );
              }
            }
          });
        },
      });
    }
  } catch (error) {
    // Error handling (no console logs as requested)
  }
});
