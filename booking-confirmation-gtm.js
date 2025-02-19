window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
  try {
    // Wait for the API response
    const result = await Wized.requests.waitFor("Get_Booked_Property");
    console.log("API Response:", result);

    // Extract data safely
    const bookingData = result.data?.booking || {};
    const propertyData = result.data?.property || {};
    const paymentData = result.data?.payment || {};

    // Push data to the dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "purchase", // GA4 event name
      transaction_id: paymentData?.stripe_id || "unknown", // Payment transaction ID
      value: bookingData?.total_price || 0, // Total booking value
      currency: "CAD", // Currency (assumed fixed as CAD)
      property_name: propertyData?.name || "unknown", // Name of the booked property
      guests: bookingData?.guests || 0, // Number of guests
      arrival_date: bookingData?.arrival_date || "unknown", // Check-in date
      departure_date: bookingData?.departure_date || "unknown", // Check-out date
      nights_booked: bookingData?.booked_nights || 0, // Total number of nights booked
      taxes: {
        PST: bookingData?.PST || 0,
        GST: bookingData?.GST || 0,
        MRDT: bookingData?.MRDT || 0,
      }, // Tax breakdown
      breakdown: bookingData?.breakdown || [], // Detailed cost breakdown
      pet_friendly: propertyData?.Pet_Friendly || false, // Whether the property is pet-friendly
      property_location: propertyData?.city || "unknown", // City where the property is located
      payment_status: paymentData?.status || "unknown", // Payment status
    });

    console.log("Data pushed to GTM dataLayer:", window.dataLayer);
  } catch (error) {
    console.error("Error fetching booked property data:", error);
  }
});