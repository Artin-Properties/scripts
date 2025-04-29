let lastClickedValueHomeFilter = null;

document.querySelectorAll('input[name="Home-Filter"]').forEach((input) => {
  input.addEventListener("click", function () {
    const clickedValue = input.value;

    // Clicking the same filter again → remove visual classes and reset lastClickedValueHomeFilter
    if (lastClickedValueHomeFilter === clickedValue) {
      document.querySelectorAll(`.home_filter_radio-button.is-${clickedValue}`).forEach((el) => {
        el.classList.remove("w--redirected-checked", "w--redirected-focus");
      });
      lastClickedValueHomeFilter = null;
      return;
    }

    lastClickedValueHomeFilter = clickedValue;

    setTimeout(() => {
      document.querySelectorAll(".home_filter_radio-button").forEach((el) => {
        el.classList.remove("w--redirected-focus");
      });

      document.querySelectorAll(`.home_filter_radio-button.is-${clickedValue}`).forEach((el) => {
        el.classList.remove("w--redirected-checked");
      });

      document.querySelectorAll(`.home_filter_radio-button.is-${clickedValue}`).forEach((el) => {
        el.classList.add("w--redirected-checked", "w--redirected-focus");
      });
    }, 50);
  });
});
