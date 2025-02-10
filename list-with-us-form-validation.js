document.getElementById("wf-form-List-with-us-form").addEventListener("submit", async function(event) {
  event.preventDefault(); // Prevent form from submitting initially

  let isValid = true;

  // Input validation rules
  const fields = [
    { id: "Full-Name", message: "Name is required", validator: value => value.trim() !== "" },
    { id: "Email", message: "Enter a valid email", validator: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
    { id: "Phone", message: "Password must be at least 6 characters", validator: value => value.length >= 6 },
    { id: "Address", message: "Password must be at least 6 characters", validator: value => value.length >= 6 },
    { id: "City", message: "Password must be at least 6 characters", validator: value => value.length >= 6 },
    { id: "State-Province", message: "Password must be at least 6 characters", validator: value => value.length >= 6 },
    { id: "Postal-Zip-Code", message: "Password must be at least 6 characters", validator: value => value.length >= 6 },
  ];

  fields.forEach(field => {
    const input = document.getElementById(field.id);
    const errorElement = document.getElementById(field.id + "-Error");

    if (!field.validator(input.value)) {
      isValid = false;
      errorElement.textContent = field.message;
    } else {
      errorElement.textContent = ""; // Remove error message
    }
  });

  // If all fields are valid, submit the form
  if (isValid) {
    const result = await Wized.requests.execute('submit_list_with_us');
    console.log(result);
  }
});
