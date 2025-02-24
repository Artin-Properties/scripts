let stripe;
let elements;
let paymentElement;
let currentClientSecret;

function initializeOrUpdateStripe(clientSecret) {
  if (!clientSecret) {
    console.error("Client secret is undefined or null. Cannot initialize Stripe.");
    return;
  }

  if (currentClientSecret === clientSecret) {
    return;
  }

  currentClientSecret = clientSecret;

  if (!stripe) {
    const isLiveDomain =
      window.location.hostname === "www.artinproperties.ca" ||
      window.location.hostname === "artinproperties.ca";
    const publicKey =
      isLiveDomain && window.location.pathname === "/customer/book-stay"
        ? "pk_live_51PYc9DCXrq3o7kT5480apFZp01v1rFjnsK5TMdghUAzK3eAXSPgW6h3mUpiwkjJQlDbKOFn7qLsHCndycf4uTdQP00CVdlgF5F"
        : "pk_test_51PYc9DCXrq3o7kT5Ill50lw8DAj0FU04z9TZj1d6fmEI13XazRzzsbSarBeLbJ0JmZaAyFhXX4P0JVzu0oylo4NJ00s6mK1q5Y";

    stripe = Stripe(publicKey);
  }

  const appearance = {
    theme: "night",
    variables: {
      colorPrimary: "#ffffff",
      colorBackground: "#121212",
      colorText: "#ffffff",
      colorDanger: "#ff4d4f",
      fontFamily: "Arial, sans-serif",
      fontSizeBase: "16px",
    },
  };

  const options = {
    layout: {
      type: "tabs",
      defaultCollapsed: true,
    },
  };

  // Unmount existing payment element if it exists
  if (paymentElement) {
    paymentElement.unmount();
    paymentElement = null;
  }

  // Create new elements instance
  elements = stripe.elements({ clientSecret, appearance });

  if (!elements) {
    console.error("Failed to initialize Stripe Elements.");
    return;
  }

  paymentElement = elements.create("payment", options);

  if (!paymentElement) {
    console.error("Failed to create Payment Element.");
    return;
  }

  const paymentElementContainer = document.getElementById("payment-element");
  if (!paymentElementContainer) {
    console.error("#payment-element container not found in the DOM.");
    return;
  }

  paymentElement.mount("#payment-element");
}

// Global function to trigger handleSubmit
window.triggerSubmit = async function () {
  if (!elements) {
    console.error("Stripe Elements not initialized");
    return;
  }

  try {
    // Update the booking button text to indicate processing
    const buttonTextElement = document.querySelector('[wized="booking_BookingButtonText"]');
    if (buttonTextElement) {
      buttonTextElement.textContent = "Processing Payment...";
    }

    // Determine the return URL based on the domain and pathname
    const isLiveDomain =
      window.location.hostname === "www.artinproperties.ca" ||
      window.location.hostname === "artinproperties.ca";

    const returnUrl =
      isLiveDomain && window.location.pathname === "/customer/book-stay"
        ? "https://artinproperties.ca/customer/book-stay-confirmed"
        : "https://artin-properties.webflow.io/customer/book-stay-confirmed";

    // Confirm the payment using Stripe Elements
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl, // Dynamically set return URL
      },
    });

    // Handle the result of the payment confirmation
    if (result.error) {
      console.error("Payment failed:", result.error.message);
      if (buttonTextElement) {
        buttonTextElement.textContent = "Payment Failed. Try Again.";
      }
    } else {
      console.log("Payment succeeded:", result.paymentIntent);
      if (buttonTextElement) {
        buttonTextElement.textContent = "Payment Succeeded!";
      }
    }
  } catch (error) {
    console.error("Error during payment submission:", error);
    const buttonTextElement = document.querySelector('[wized="booking_BookingButtonText"]');
    if (buttonTextElement) {
      buttonTextElement.textContent = "Payment Failed. Try Again.";
    }
  }
};

function handleError(error) {
  const message = error.message || "An unknown error occurred.";
  console.error("Payment error:", message);

  const errorElement = document.querySelector('[wized="stripePaymentError"]');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
}

// Initialize Stripe once the Wized request is complete
window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
  try {
    const result = await Wized.requests.waitFor("Create_Booking");
    const clientSecret = result?.data?.stripe?.client_secret;

    if (clientSecret) {
      initializeOrUpdateStripe(clientSecret);
    } else {
      console.error("Failed to retrieve client secret from Create_Booking.");
    }
  } catch (error) {
    console.error("Error during Wized request Create_Booking:", error);
  }
});
