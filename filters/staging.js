document.querySelectorAll('input[name="Property-Type"]').forEach((input) => {
  input.addEventListener("click", function () {
    console.log("value", input.value);
    const clickedValue = input.value;

    // Step 1: Remove the visual active class from all radio buttons
    document.querySelectorAll(".properties_link-button .w-radio-input").forEach((el) => {
      console.log("element", el);
      el.classList.remove("w--redirected-checked");
    });

    // Step 2: Find ALL radios that have the same value as clicked one
    const matchingInputs = Array.from(
      document.querySelectorAll('input[name="Property-Type"]')
    ).filter((input) => input.value === clickedValue);

    console.log("matchingInputs", matchingInputs);
    // Step 3: Add the visual active class back to the matching ones
    matchingInputs.forEach((input) => {
      const wrapper = input.closest("label")?.querySelector(".w-radio-input");
      if (wrapper) {
        wrapper.classList.add("w--redirected-checked");
      }
    });
  });
});
