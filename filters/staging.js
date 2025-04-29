document.querySelectorAll('input[name="Property-Type"]').forEach((input) => {
  input.addEventListener("click", function () {
    const clickedValue = input.value;

    // All radio wrappers
    const allWrappers = document.querySelectorAll(".w-radio-input");

    // Find all matching radios (same value)
    const matchingInputs = Array.from(
      document.querySelectorAll('input[name="Property-Type"]')
    ).filter((input) => input.value === clickedValue);

    // Check if already active (based on first match)
    const anyWrapper = matchingInputs[0]?.closest("label")?.querySelector(".w-radio-input");
    const isActive = anyWrapper?.classList.contains("w--redirected-checked");

    // Remove from all radio wrappers
    allWrappers.forEach((el) => el.classList.remove("w--redirected-checked"));

    // If it was not active, add to all matching wrappers
    if (!isActive) {
      matchingInputs.forEach((input) => {
        const wrapper = input.closest("label")?.querySelector(".w-radio-input");
        if (wrapper) wrapper.classList.add("w--redirected-checked");
      });
    }
  });
});
