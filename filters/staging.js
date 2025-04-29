document.querySelectorAll('input[name="Property-Type"]').forEach((input) => {
  input.addEventListener("click", function () {
    const clickedValue = input.value;

    // Step 1: Remove the visual active class from all radio buttons
    document.querySelectorAll(`.properties_link-button .is-${clickedValue}`).forEach((el) => {
      console.log("remove", el);
      el.classList.remove("w--redirected-checked");
    });

    // Step 3: Add the visual active class back to the matching ones
    document.querySelectorAll(`.properties_link-button .is-${clickedValue}`).forEach((el) => {
      console.log("add", el);
      el.classList.add("w--redirected-checked");
    });
  });
});
