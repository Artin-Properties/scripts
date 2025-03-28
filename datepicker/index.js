document.addEventListener("DOMContentLoaded", function () {
  // Define your own logic for what counts as "staging"
  const environment = window.location.href.includes("artin-properties.webflow.io")
    ? "staging"
    : "production";

  const script = document.createElement("script");
  script.src = `https://artin-properties.github.io/scripts/datepicker/${environment}.js`;
  script.defer = true;

  document.head.appendChild(script);
});
