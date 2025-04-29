document.querySelectorAll('input[name="Property-Type"]').forEach((input) => {
  input.addEventListener("click", function () {
    const clickedValue = input.value;
    const wrapper = input.closest("label")?.querySelector(".w-radio-input");

    const isActive = wrapper?.classList.contains("w--redirected-checked");

    // Remove class from all
    document.querySelectorAll(".w-radio-input").forEach((el) => {
      el.classList.remove("w--redirected-checked");
    });

    // If it was not active before, re-add the class to this one
    if (!isActive && wrapper) {
      wrapper.classList.add("w--redirected-checked");
    }
  });
});
