// Ensure Wized is initialized and ready before running the custom script
window.Wized = window.Wized || [];
window.Wized.push((Wized) => {
  let swipers = [];
  let observer;
  let isLoading = false;
  let isEndReached = false;
  let lastRequestTime = 0;
  let scrollLoadCount = 0;
  let currentScrollPosition = 0;
  let lastItemHeight = 0;

  // Function to get the origin, with fallback
  function getOrigin() {
    return (
      window.location.origin ||
      window.location.protocol +
        "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port : "")
    );
  }

  // Initialize Swiper components with passive event listeners
  function initSwiper() {
    // Destroy existing Swiper instances to prevent duplicates
    swipers.forEach((swiper) => swiper.destroy(true, true));
    swipers = [];

    // Initialize Swiper for each properties_card-visual element
    $(".properties_card-visual").each(function () {
      const swiperInstance = new Swiper($(this).find(".swiper")[0], {
        speed: 300,
        autoHeight: false,
        followFinger: true,
        slidesPerView: 1,
        spaceBetween: "0%",
        loop: true,
        passiveListeners: true,
        mousewheel: {
          forceToAxis: true,
          releaseOnEdges: true,
        },
        keyboard: {
          enabled: true,
          onlyInViewport: true,
        },
        pagination: {
          el: $(this).find(".swiper-pagination")[0],
          dynamicBullets: true,
        },
        navigation: {
          nextEl: $(this).find(".swiper-next")[0],
          prevEl: $(this).find(".swiper-prev")[0],
          disabledClass: "is-disabled",
        },
        slideActiveClass: "is-active",
        slideDuplicateActiveClass: "is-active",
      });

      swipers.push(swiperInstance);
    });
  }

  // Remove all existing cloned mix items
  function clearExistingMixItems() {
    const existingClones = document.querySelectorAll(
      ".properties_list .mix, .properties_list .mix-item"
    );
    existingClones.forEach((clone) => {
      clone.parentNode.removeChild(clone);
    });
  }

  // Reset property array and update the DOM upon filter click
  async function resetPropertyArrayOnClick() {
    if (isLoading) return;

    isLoading = true;
    clearExistingMixItems();

    try {
      const result = await Wized.requests.waitFor("Search_Properties");
      const items = result.data.items;
      Wized.data.v.property_array = items;

      insertMixItemsIntoDOM();
      setPropertyLinks();
      reinitializeComponents();
    } catch (error) {
      console.error("Error resetting property array:", error);
    } finally {
      isLoading = false;
    }
  }

  // Insert mix items into the DOM
  function insertMixItemsIntoDOM() {
    clearExistingMixItems();

    const items = document.querySelectorAll(
      ".properties_list .properties_item:not(#mix-1):not(#mix-2):not(#mix-3):not(.mix-item)"
    );

    if (Wized.data.v.property_array.length === 0) return;

    const mixItems = ["mix-1", "mix-2", "mix-3"];
    let currentMixIndex = 0;
    const cloneCounts = { "mix-1": 0, "mix-2": 0, "mix-3": 0 };

    items.forEach((item, index) => {
      if ((index + 1) % 4 === 0) {
        const mixId = mixItems[currentMixIndex];
        const originalMixItem = document.getElementById(mixId);

        if (originalMixItem) {
          cloneCounts[mixId] += 1;
          const mixItemClone = originalMixItem.cloneNode(true);
          mixItemClone.id = `${mixId}-clone-${cloneCounts[mixId]}`;
          mixItemClone.classList.add("mix-item");
          item.after(mixItemClone);
          mixItemClone.style.display = "";
          currentMixIndex = (currentMixIndex + 1) % mixItems.length;
        }
      }
    });
  }

  // Set property links
  function setPropertyLinks() {
    const origin = getOrigin();
    const propertyItems = document.querySelectorAll(
      ".properties_list .properties_item:not(#mix-1):not(#mix-2):not(#mix-3):not(.mix-item)"
    );

    propertyItems.forEach((item) => {
      const propertyId = item.getAttribute("data-property-id");
      if (propertyId) {
        const linkElement = item.querySelector(".properties_card-visual");
        if (linkElement) {
          const href = `${origin}/property?property=${propertyId}`;
          linkElement.setAttribute("href", href);
        }
      }
    });
  }

  // Reinitialize components
  function reinitializeComponents() {
    window.Webflow.destroy();
    window.Webflow.ready();
    window.Webflow.require("ix2")?.init();
    initSwiper();
  }

  // Load more items with scroll position preservation
  async function loadMoreItems() {
    if (isLoading) return;

    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      isLoading = false;
      return;
    }

    isLoading = true;
    lastRequestTime = now;

    // // Store current scroll position and last item height
    // const propertyItems = document.querySelectorAll('[wized="home_PropertyItem"]');
    // const lastItem = propertyItems[propertyItems.length - 1];
    // if (lastItem) {
    //   currentScrollPosition = window.scrollY;
    //   lastItemHeight = lastItem.getBoundingClientRect().height;
    // }

    // Disconnect observer before updates
    if (observer) {
      observer.disconnect();
    }

    try {
      let searchPagination = Wized.data.v.search_pagination || 1;
      searchPagination += 1;
      Wized.data.v.search_pagination = searchPagination;

      const existingPropertyArray = Wized.data.v.property_array || [];
      const result = await Wized.requests.execute("Search_Properties");
      const newItems = result.data.items || [];

      const existingIds = new Set(existingPropertyArray.map((item) => item.id));
      const filteredNewItems = newItems.filter((item) => !existingIds.has(item.id));

      // Update the array
      Wized.data.v.property_array = [...existingPropertyArray, ...filteredNewItems];

      // Update DOM
      insertMixItemsIntoDOM();
      setPropertyLinks();
      reinitializeComponents();

      // // Restore scroll position
      // if (lastItem) {
      //   const newLastItem = document.querySelectorAll('[wized="home_PropertyItem"]')[
      //     propertyItems.length - 1
      //   ];
      //   if (newLastItem) {
      //     const newPosition =
      //       currentScrollPosition + (newLastItem.getBoundingClientRect().height - lastItemHeight);
      //     window.scrollTo(0, newPosition);
      //   }
      // }

      if (result.data.nextPage === null) {
        isEndReached = true;
      }

      // Reconnect observer if needed
      if (!isEndReached && scrollLoadCount !== 3) {
        observeLastElement();
      }
    } catch (error) {
      console.error("Error loading more items:", error);
    } finally {
      isLoading = false;
    }
  }

  // Observe last element for infinite scroll
  function observeLastElement() {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading && !isEndReached && scrollLoadCount < 3) {
            loadMoreItems();
            scrollLoadCount++;
          }

          if (scrollLoadCount === 3) {
            setTimeout(() => {
              const showMoreBtn = document.getElementById("showMore");
              if (showMoreBtn) {
                showMoreBtn.style.display = "block";
              }
              observer.disconnect();
            }, 3000);
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.5 }
    );

    const firstList = document.querySelector(".properties_list");
    if (firstList) {
      const items = firstList.querySelectorAll(".properties_item");
      if (items.length > 0) {
        const targetIndex = Math.max(0, items.length - 10);
        console.log(items[targetIndex]);
        observer.observe(items[targetIndex]);
      }
    }
  }

  // Setup filter click listeners
  function setupFilterClickListeners() {
    const clickableElements = [
      "term_ALL",
      "term_STR",
      "term_MTR",
      "term_LTR",
      "individual_filter_all",
      "individual_filter_availtoday",
      "individual_filter_budgetfriendly",
      "individual_filter_lastmindeals",
      "individual_filter_newlistings",
      "individual_filter_petfriendly",
      "individual_filter_signaturehomes",
      "individual_filter_unfurnished",
      "individual_filter_workready",
      "ai_search_submit",
    ];

    clickableElements.forEach((wizedAttribute) => {
      const elements = document.querySelectorAll(`[wized="${wizedAttribute}"]`);
      elements.forEach((element) => {
        element.addEventListener("click", resetPropertyArrayOnClick);
      });
    });
  }

  // Check initial data
  async function checkInitialData() {
    const propertyArray = Wized.data.v.property_array;
    if (!propertyArray || propertyArray.length === 0) {
      const initialResult = await Wized.requests.waitFor("Search_Properties");
      const initialItems = initialResult.data.items;
      Wized.data.v.property_array = initialItems;

      insertMixItemsIntoDOM();
      setPropertyLinks();
    }
  }

  // Initialize the application
  (async () => {
    await checkInitialData();
    setupFilterClickListeners();
    initSwiper();
    observeLastElement();

    const showMoreBtn = document.getElementById("showMore");
    if (showMoreBtn) {
      showMoreBtn.addEventListener("click", async () => {
        if (!isLoading && !isEndReached) {
          await loadMoreItems();
        }
      });
    }
  })();
});
