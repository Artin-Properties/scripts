$('input[name="Property-Type"]').on("click", function (e) {
  const clicked = $(this);
  const clickedValue = clicked.val();

  // Find all radios with same value (STR, MTR, LTR) across both forms
  const matchingRadios = $('input[name="Property-Type"]').filter(function () {
    return $(this).val() === clickedValue;
  });

  // If the clicked radio was already checked -> uncheck both
  if (clicked.prop("checked")) {
    const wasAlreadyChecked = clicked.data("waschecked");

    if (wasAlreadyChecked) {
      // Uncheck all radios
      matchingRadios.prop("checked", false).trigger("change");
      // Reset waschecked state
      $('input[name="Property-Type"]').data("waschecked", false);
    } else {
      // First time checked, make sure all matching are checked
      matchingRadios.prop("checked", true).trigger("change");
      // Uncheck others
      $('input[name="Property-Type"]').not(matchingRadios).prop("checked", false).trigger("change");

      // Set this one as waschecked
      $('input[name="Property-Type"]').data("waschecked", false);
      matchingRadios.data("waschecked", true);
    }
  }
});
