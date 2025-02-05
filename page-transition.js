$(document).ready(function() {
  // Check if the current URL is staging
  const isStaging = window.location.pathname.startsWith("/v2/page/proxy");
  
  if (isStaging) {
    const transitionTrigger = document.querySelector(".transition-trigger");
  
    // Trigger transition on page load for staging environment
    if (transitionTrigger) {
      transitionTrigger.click();
    }
  } else {
    // Configuration for multiple pages with support for wildcards
    const pageConfig = {
      "/property": {
        requestName: "Get_Property",
        transitionURL: "/property",
        autoTransition: false,
      },
      "/customer/book-stay": {
        requestName: "Get_Property",
        transitionURL: "/customer/book-stay",
        autoTransition: false,
      },
      "/customer/dashboard": {
        requestName: "Fetch_Bookmarks",
        transitionURL: "/customer/dashboard",
        autoTransition: false,
      },
      "/customer/booking": {
        requestName: "Fetch_Booking",
        transitionURL: "/customer/booking",
        autoTransition: false,
      },
      "/customer/book-stay-confirmed": {
        requestName: "Get_Booked_Property",
        transitionURL: "/customer/book-stay-confirmed",
        autoTransition: false,
      },
      "/customer/account-settings": {
        requestName: "auth_me",
        transitionURL: "/customer/account-settings",
        autoTransition: false,
      },
      "/auth/*": { autoTransition: true },
      "/map": { autoTransition: true },
      // Add more pages or wildcard patterns as needed
    };
  
    // Utility to get configuration based on the current URL
    function getPageConfig() {
      const path = window.location.pathname;
  
      // Check for exact matches first
      if (pageConfig[path]) {
        return pageConfig[path];
      }
  
      // Check for wildcard matches
      for (const pattern in pageConfig) {
        if (pattern.endsWith("/*")) {
          const basePath = pattern.slice(0, -2); // Remove "/*" from the pattern
          if (path.startsWith(basePath)) {
            return pageConfig[pattern];
          }
        }
      }
  
      return null; // Return null if no config is found
    }
  
    // Function to handle Wized requests and transitions
    async function handlePageTransition(config) {
      const transitionTrigger = $(".transition-trigger");
      const introDurationMS = 500; // Adjusted for visibility
      const exitDurationMS = 1200;
      const excludedClass = "no-transition";
  
      // Utility to wait for a Wized request
      async function waitForWizedRequest(requestName, maxRetries = 10, interval = 200) {
        for (let attempts = 0; attempts < maxRetries; attempts++) {
          try {
            const response = await Wized.requests.waitFor(requestName);
            if (response.status === 200) {
              return response;
            }
          } catch (error) {
            // Retry on failure
          }
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error(`Max retries reached for request: ${requestName}`);
      }
  
      // Event listener for transition trigger clicks
      transitionTrigger.on("click", function() {
        $("body").addClass("transition-active");
        // Add any additional transition logic here
        setTimeout(() => {
          $("body").removeClass("transition-active");
        }, introDurationMS);
      });
  
      // Automatically trigger transition for pages with autoTransition
      if (config.autoTransition) {
        if (transitionTrigger.length > 0) {
          transitionTrigger.click();
          $("body").addClass("no-scroll-transition");
          setTimeout(() => {
            $("body").removeClass("no-scroll-transition");
          }, introDurationMS);
        }
        return;
      }
  
      // On Page Load
      if (transitionTrigger.length > 0 && config.requestName) {
        try {
          await waitForWizedRequest(config.requestName);
          transitionTrigger.click();
          $("body").addClass("no-scroll-transition transition-active");
          setTimeout(() => {
            $("body").removeClass("no-scroll-transition transition-active");
          }, introDurationMS);
        } catch (error) {
          // Error handling if necessary
        }
      }
  
      // On Link Click
      $("a").not(".finished").addClass("finished").on("click", function (e) {
        const transitionURL = $(this).attr("href");
        if (
          $(this).prop("hostname") === window.location.hostname &&
          !$(this).attr("href").includes("#") &&
          !$(this).hasClass(excludedClass) &&
          $(this).attr("target") !== "_blank" &&
          transitionTrigger.length > 0
        ) {
          e.preventDefault();
          $("body").addClass("no-scroll-transition");
          transitionTrigger.click();
          setTimeout(() => {
            window.location = transitionURL;
          }, exitDurationMS);
        }
      });
  
      // On Back Button Tap
      window.onpageshow = (event) => {
        if (event.persisted) {
          window.location.reload();
        }
      };
  
      // Hide Transition on Window Resize
      $(window).on("resize", function () {
        setTimeout(() => {
          $(".transition").hide();
        }, 50);
      });
    }
  
    // Initialize the transitions dynamically
    const config = getPageConfig();
    if (config) {
      handlePageTransition(config).catch((error) => {
        // Error handling if necessary
      });
    } else {
      // Handle no configuration found
    }
  }
});