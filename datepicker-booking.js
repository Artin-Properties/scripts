// Helper function to format Date objects to 'YYYY-MM-DD' without time zone issues
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper function to check if current time is past 8 PM
function isPastBookingTime() {
  const now = new Date();
  return now.getHours() >= 20; // 20 is 8 PM in 24-hour format
}

function getOneText(num) {
  return num === 1 ? `Minimum Nights ${minNights}` : "1 night";
}
let minNights;
let maxNights;

// Initialize Easepick date picker after the Wized request completes
window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
  try {
    const [propertyDetail, result] = await Promise.all([
      Wized.requests.waitFor("Get_Property"),
      Wized.requests.waitFor("Get_Property_Dates"),
    ]);

    minNights = propertyDetail.data.minNights;
    maxNights = propertyDetail.data.maxNights;
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

        if (date >= today) {
          const formattedDate = formatDate(date);

          // If today is the last day of a booking, allow check-in
          const isLastDayOfBooking = dateObj.check_out_available && !dateObj.available;

          // If a date is the first day of a booking, it should only allow checkout (not selectable for check-in)
          const isFirstDayOfBooking = dateObj.check_in_available && !dateObj.available;

          // Add price only if it's available, or if today is a valid check-in/check-out scenario
          if (
            dateObj.available ||
            isLastDayOfBooking ||
            (dateObj.check_out_available && !isFirstDayOfBooking)
          ) {
            prices[formattedDate] = dateObj.price;
          }
        }
      });
      let text = `Minimum Stay ${minNights} Night`;
      picker = new easepick.create({
        element: "#datepicker",
        css: [
          "https://artin-properties.github.io/scripts/datepicker-theme.css", // Replace with your CSS URL
          "https://artin-properties.github.io/scripts/datepicker.css",
        ],
        inline: true,
        zIndex: 10,
        calendars: 2,
        plugins: ["AmpPlugin", "RangePlugin", "LockPlugin"],
        RangePlugin: {
          tooltip: true,
          tooltipNumber(num) {
            if (num === 1) {
              return ""; // Return empty string for zero
            }
            return num - 1;
          },
          locale: {
            zero: text,
            one: "night",
            other: "nights",
          },
        },
        LockPlugin: {
          minDate: new Date(),
          inseparable: true,
          maxNights: maxNights,
          filter(date, picked) {
            const formattedDate = date.format("YYYY-MM-DD");
            const dateObj = result.data.date_object.find((obj) => obj.date === formattedDate);
            if (!dateObj) {
              return false;
            }

            // Check if the date is today and if it's past 8 PM
            const today = new Date();
            const dateToCheck = new Date(date.getTime());
            const isToday = dateToCheck.toDateString() === today.toDateString();

            if (isToday && isPastBookingTime()) {
              return true; // Lock the date if it's today and past 8 PM
            }

            const isAvailable = dateObj.available;
            const isAvailableForCheckIn = dateObj.check_in_available;
            const isAvailableForCheckOut = dateObj.check_out_available;

            // If today is the last day of a booking, allow check-in
            const isLastDayOfBooking = isAvailableForCheckOut && !isAvailable;

            // If a date is the first day of a booking, it should only allow checkout (not selectable for check-in)
            const isFirstDayOfBooking = isAvailableForCheckIn && !isAvailable;

            return !(
              isAvailable ||
              isLastDayOfBooking ||
              (isAvailableForCheckOut && !isFirstDayOfBooking)
            );
          },
        },

        setup(picker) {
          let isFirstSelection = true;
          picker.on("preselect", (evt) => {
            const startDate = evt.detail.start;
            const lockPlugin = picker.PluginManager.getInstance("LockPlugin");
            const rangePlugin = picker.PluginManager.getInstance("RangePlugin");

            if (startDate) {
              lockPlugin.options.minDate = startDate;
              isFirstSelection = true; // Reset when selecting a new start date
            }

            let firstLockedDate = null;

            // Find the first locked date from the result data
            for (const dateObj of result.data.date_object) {
              if (!dateObj.available) {
                // If the date is locked
                firstLockedDate = new Date(dateObj.date);
                break; // Stop at the first locked date
              }
            }

            // Set maxDate to the first locked date if found
            if (firstLockedDate && firstLockedDate > startDate) {
              lockPlugin.options.maxDate = firstLockedDate;
            } else {
              lockPlugin.options.maxDate = null; // No restriction if no locked date is found
            }
          });

          let lastEndDate = null;
          picker.on("select", () => {
            const startDate = picker.getStartDate();
            const endDate = picker.getEndDate();

            const lockPlugin = picker.PluginManager.getInstance("LockPlugin");

            if (startDate) {
              lockPlugin.options.minDate = new Date(); // Ensure minDate is always today
              picker.PluginManager.reloadInstance("LockPlugin");
            } else {
              lockPlugin.options.minDate = new Date(); // Keep minDate at today to avoid unwanted locking
              picker.PluginManager.reloadInstance("LockPlugin");
            }

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

              const [...leadingdates] = selectedDates;
              const checkoutdate = leadingdates.pop();

              for (let date of leadingdates) {
                const dateObj = result.data.date_object.find((obj) => obj.date === date);

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
              const dateObj = result.data.date_object.find((obj) => obj.date === checkoutdate);

              if (!dateObj.check_out_available && !dateObj.available) {
                isInvalidRange = true;
              }
              //   const targetElement = document.querySelector(".price_form-field-wrap-2");

              // Check if an error message already exists
              //   let existingError = targetElement.parentNode.querySelector(".input_error");
              if (startDate && endDate) {
                const totalNights = Math.round(
                  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                const minStay = Wized.data.r.Get_Property_Dates.data.date_object.find(
                  (entry) => entry.date === arrivalDateStr
                )?.minimumStay;
                const parsedMinStay = Number(minStay) || Wized.data.r.Get_Property.data.minNights;

                const maxStay = Wized.data.r.Get_Property_Dates.data.date_object.find(
                  (entry) => entry.date === departureDateStr
                )?.maximumStay;
                const parsedMaxStay = Number(maxStay) || Wized.data.r.Get_Property.data.maxNights;

                if (
                  (parsedMinStay && totalNights < parsedMinStay) ||
                  (parsedMaxStay && totalNights > parsedMaxStay)
                ) {
                  isInvalidRange = true;

                  // Remove existing error if input becomes valid
                  //   if (existingError) {
                  //     existingError.remove();
                  //   }

                  //   // Create a new error element only if input is invalid
                  //   if (minNights && totalNights < minNights) {
                  //     const newElement = document.createElement("div");
                  //     newElement.classList.add("input_error", "is-red");
                  //     newElement.style.marginTop = "1rem";
                  //     newElement.style.marginBottom = "0.5rem";
                  //     newElement.style.justifyContent = "center";
                  //     newElement.textContent = `The minimum stay is ${minNights} nights`;
                  //     targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
                  //   } else if (maxNights && totalNights > maxNights) {
                  //     const newElement = document.createElement("div");
                  //     newElement.classList.add("input_error", "is-red");
                  //     newElement.style.marginTop = "1rem";
                  //     newElement.style.marginBottom = "0.5rem";
                  //     newElement.style.justifyContent = "center";
                  //     newElement.textContent = `The maximum stay is ${maxNights} nights`;
                  //     targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
                  //   } else if (existingError) {
                  //     existingError.remove();
                  //   }
                }
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
                // if (existingError) {
                //   existingError.remove();
                // }
              }
            }
          });

          picker.gotoDate(new Date(result.data.datestreak.startDate));

          picker.on("view", (evt) => {
            const { view, date, target } = evt.detail;
            const formattedDate = date ? date.format("YYYY-MM-DD") : null;

            if (view === "CalendarDay" && prices[formattedDate]) {
              const span = target.querySelector(".day-price") || document.createElement("span");
              span.className = "day-price";
              span.innerHTML = `$${prices[formattedDate]}`;
              target.append(span);

              if (target.classList.contains("locked")) {
                const priceElement = target.querySelector(".day-price");
                if (priceElement) {
                  priceElement.style.display = "none";
                }
                target.style.setProperty("background-color", "transparent", "important");
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
