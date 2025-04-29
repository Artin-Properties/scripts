document.querySelectorAll('input[name="Property-Type"]').forEach((input) => {
  input.addEventListener("click", function () {
    const clickedValue = input.value;
    setTimeout(() => {
      // Step 1: Remove the visual active class from all radio buttons
      document.querySelectorAll(`.properties_link-button.is-${clickedValue}`).forEach((el) => {
        el.classList.remove("w--redirected-checked w--redirected-focus");
      });

      // Step 3: Add the visual active class back to the matching ones
      document.querySelectorAll(`.properties_link-button.is-${clickedValue}`).forEach((el) => {
        el.classList.add("w--redirected-checked w--redirected-focus");
        console.log("add", el);
      });
    }, 50);
  });
});
