let lastClickedValue = null;

document.querySelectorAll('input[name="Property-Type"]').forEach((input) => {
  input.addEventListener("click", function () {
    const clickedValue = input.value;

    // Clicking the same filter again → remove visual classes and reset lastClickedValue
    if (lastClickedValue === clickedValue) {
      document.querySelectorAll(`.properties_link-button.is-${clickedValue}`).forEach((el) => {
        el.classList.remove("w--redirected-checked", "w--redirected-focus");
      });
      lastClickedValue = null;
      return;
    }

    lastClickedValue = clickedValue;

    setTimeout(() => {
      document.querySelectorAll(".properties_link-button").forEach((el) => {
        el.classList.remove("w--redirected-focus");
      });

      document.querySelectorAll(`.properties_link-button.is-${clickedValue}`).forEach((el) => {
        el.classList.remove("w--redirected-checked");
      });

      document.querySelectorAll(`.properties_link-button.is-${clickedValue}`).forEach((el) => {
        el.classList.add("w--redirected-checked", "w--redirected-focus");
        console.log("add", el);
      });
    }, 50);
  });
});
