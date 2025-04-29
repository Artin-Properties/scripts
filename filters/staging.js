document.querySelectorAll('input[name="Property-Type"]').forEach((input) => {
  input.addEventListener("click", function () {
    const clickedValue = input.value;

    // Step 1: Remove the visual active class from all radio buttons
    document.querySelectorAll(".w-radio-input").forEach((el) => {
      el.classList.remove("w--redirected-checked");
    });

    // Step 2: Find ALL radios that have the same value as clicked one
    const matchingInputs = Array.from(
      document.querySelectorAll('input[name="Property-Type"]')
    ).filter((input) => input.value === clickedValue);

    // Step 3: Add the visual active class back to the matching ones
    matchingInputs.forEach((input) => {
      const wrapper = input.closest("label")?.querySelector(".w-radio-input");
      if (wrapper) {
        wrapper.classList.add("w--redirected-checked");
      }
    });
  });
});
