document.querySelectorAll('input[name="Property-Type"]').forEach(function (radio) {
  radio.addEventListener("click", function (e) {
    const clicked = e.target;
    const clickedValue = clicked.value;

    // Find all radios with same value across both forms
    const matchingRadios = Array.from(
      document.querySelectorAll('input[name="Property-Type"]')
    ).filter(function (radio) {
      return radio.value === clickedValue;
    });

    const wasAlreadyChecked = clicked.dataset.waschecked === "true";

    if (clicked.checked) {
      if (wasAlreadyChecked) {
        // Uncheck all matching radios
        matchingRadios.forEach(function (radio) {
          radio.checked = false;
          radio.dispatchEvent(new Event("change"));
          radio.dataset.waschecked = "false";
        });
      } else {
        // Check all matching radios
        matchingRadios.forEach(function (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change"));
          radio.dataset.waschecked = "true";
        });

        // Uncheck all non-matching radios
        Array.from(document.querySelectorAll('input[name="Property-Type"]')).forEach(
          function (radio) {
            if (!matchingRadios.includes(radio)) {
              radio.checked = false;
              radio.dispatchEvent(new Event("change"));
              radio.dataset.waschecked = "false";
            }
          }
        );
      }
    }
  });
});
