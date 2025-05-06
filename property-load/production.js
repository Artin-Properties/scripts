// Ensure Wized is initialized and ready before running the custom script
window.Wized = window.Wized || [];
window.Wized.push((Wized) => {
  let swipers = [];
  let observer;
  let isLoading = false;
  let isEndReached = false;
  let lastRequestTime = 0;

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
        passiveListeners: true, // Enables passive event listeners globally for Swiper
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
    // Target both original mix items and cloned mix items
    const existingClones = document.querySelectorAll(
      ".properties_list .mix, .properties_list .mix-item"
    );
    existingClones.forEach((clone) => {
      clone.parentNode.removeChild(clone);
    });
  }

  // Reset property array and update the DOM upon filter click
  async function resetPropertyArrayOnClick() {
    if (isLoading) {
      return;
    }

    isLoading = true;
    clearExistingMixItems();

    try {
      const result = await Wized.requests.waitFor("Search_Properties");
      const items = result.data.items;

      // Set the property array to the fresh items
      Wized.data.v.property_array = items;

      insertMixItemsIntoDOM();
      setPropertyLinks(); // Set href attributes with correct IDs and dynamic URL

      reinitializeComponents();
    } catch (error) {
      // Optional error handling
    } finally {
      isLoading = false;
    }
  }

  // Expose the reset function globally if needed
  window.resetPropertyArrayOnClick = resetPropertyArrayOnClick;

  // Insert mix items into the DOM after every 4th property item
  function insertMixItemsIntoDOM() {
    clearExistingMixItems();

    const items = document.querySelectorAll(
      ".properties_list .properties_item:not(#mix-1):not(#mix-2):not(#mix-3):not(.mix-item)"
    );
    console.log(Wized.data.v.property_array);
    // If there are no property items, don't insert any mix items
    if (items.length === 0) {
      return;
    }

    const mixItems = ["mix-1", "mix-2", "mix-3"];
    let currentMixIndex = 0;
    const cloneCounts = { "mix-1": 0, "mix-2": 0, "mix-3": 0 };

    items.forEach((item, index) => {
      // Insert mix item after every 4th property (at position 4, 8, 12, etc.)
      // This means we check if index is 3, 7, 11, etc. (zero-based indexing)
      if ((index + 1) % 4 === 0) {
        const mixId = mixItems[currentMixIndex];
        const originalMixItem = document.getElementById(mixId);

        if (originalMixItem) {
          cloneCounts[mixId] += 1;
          const mixItemClone = originalMixItem.cloneNode(true);
          mixItemClone.id = `${mixId}-clone-${cloneCounts[mixId]}`;
          mixItemClone.classList.add("mix-item"); // Add class to identify mix items
          item.after(mixItemClone);
          mixItemClone.style.display = "";

          // Cycle through the mix items in order
          currentMixIndex = (currentMixIndex + 1) % mixItems.length;
        }
      }
    });
  }

  // Function to set the href attributes of property items
  function setPropertyLinks() {
    const origin = getOrigin();

    // Select only property items, excluding mix items
    const propertyItems = document.querySelectorAll(
      ".properties_list .properties_item:not(#mix-1):not(#mix-2):not(#mix-3):not(.mix-item)"
    );

    propertyItems.forEach((item) => {
      // Get the property ID from the data attribute
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

  // Reinitialize Webflow and Swiper components
  function reinitializeComponents() {
    window.Webflow.destroy();
    window.Webflow.ready();
    window.Webflow.require("ix2")?.init();
    initSwiper();
  }

  // Attach click event listeners to filter elements
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

  // Check and initialize data on load
  async function checkInitialData() {
    const propertyArray = Wized.data.v.property_array;
    if (!propertyArray || propertyArray.length === 0) {
      const initialResult = await Wized.requests.waitFor("Search_Properties");
      const initialItems = initialResult.data.items;
      Wized.data.v.property_array = initialItems;

      insertMixItemsIntoDOM();
      setPropertyLinks(); // Set href attributes with correct IDs and dynamic URL
    }
  }

  let scrollLoadCount = 0;

  function observeLastElement() {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading && !isEndReached && scrollLoadCount < 3) {
            loadMoreItems();
            scrollLoadCount++;
            console.log(scrollLoadCount);
          }

          if (scrollLoadCount === 3) {
            setTimeout(() => {
              const showMoreBtn = document.getElementById("showMore");
              if (showMoreBtn) {
                showMoreBtn.style.display = "block";
              }
              observer.disconnect();
            }, 3000); // 3-second delay
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.9 }
    );

    // Select the first `.properties_list`
    const firstList = document.querySelector(".properties_list");
    if (firstList) {
      const items = firstList.querySelectorAll(".properties_item"); // Select all items
      if (items.length > 0) {
        observer.observe(items[items.length - 5]); // Observe the last item
      }
    }
  }

  let loaderItemsAppended = false;
  const loaderItemHtml = `
        <div class="properties_item loader-item"><div class="properties_card"><div class="content-shimmer"><div class="properties_card-visual is-fav"><div class="swiper is-properties-card swiper-backface-hidden swiper-initialized swiper-horizontal swiper-pointer-events"><div class="swiper-wrapper is-properties-card" id="swiper-wrapper-ba218b613edad798" aria-live="polite" style="transition-duration: 0ms; transform: translate3d(-251px, 0px, 0px);"><div class="swiper-slide is-properties-card swiper-slide-duplicate is-active swiper-slide-prev" role="group" aria-label="1 / 1" data-swiper-slide-index="0" style="width: 251px; margin-right: 0px;"><div class="properties_card-img is-dash-fav"><div class="shimmer is-square is-absolute"></div></div></div><div class="swiper-slide is-properties-card is-active swiper-slide-duplicate-next swiper-slide-duplicate-prev" role="group" aria-label="1 / 1" data-swiper-slide-index="0" style="width: 251px; margin-right: 0px;"><div class="properties_card-img is-dash-fav"><div class="shimmer is-square is-absolute"></div></div></div><div class="swiper-slide is-properties-card swiper-slide-duplicate is-active swiper-slide-next" role="group" aria-label="1 / 1" data-swiper-slide-index="0" style="width: 251px; margin-right: 0px;"><div class="properties_card-img is-dash-fav"><div class="shimmer is-square is-absolute"></div></div></div></div><span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span><span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span><span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span><span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span><span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span></div></div><div class="properties_card-content"><div class="spacer-xsmall"></div><div class="preloader-layout gap-24"><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec46-af544784" class="shimmer is-rectangular height-20"></div></div><div class="preloader-layout gap-24"><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec48-af544784" class="shimmer is-rectangular height-20"></div><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec49-af544784" class="shimmer is-rectangular height-20"></div></div><div class="preloader-layout gap-24"><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec4b-af544784" class="shimmer is-rectangular height-12"></div><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec4c-af544784" class="shimmer is-rectangular height-12"></div></div><div class="preloader-layout gap-4"><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec4e-af544784" class="preloader-row gap-8"><div class="shimmer is-square is-tiny"></div></div><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec50-af544784" class="preloader-row gap-8"><div class="shimmer is-square is-tiny"></div></div><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec52-af544784" class="preloader-row gap-8"><div class="shimmer is-square is-tiny"></div></div><div id="w-node-_5c663453-3525-5ad6-3ff5-f2f21dc0ec54-af544784" class="preloader-row gap-8"><div class="shimmer is-square is-tiny"></div><div class="shimmer is-rectangular is-small"></div></div></div></div></div></div></div>
         `;
  // Load more property items when the last element is visible
  // Load more property items when the last element is visible
  async function loadMoreItems() {
    isLoading = true;
    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      // Throttle requests to 1 second
      isLoading = false;
      return;
    }
    lastRequestTime = now;

    try {
      let searchPagination = Wized.data.v.search_pagination;
      if (searchPagination === undefined) {
        searchPagination = 1;
      } else {
        searchPagination += 1;
      }
      Wized.data.v.search_pagination = searchPagination;

      const existingPropertyArray = Wized.data.v.property_array || [];
      const result = await Wized.requests.execute("Search_Properties");
      const newItems = result.data.items || [];

      // Filter out duplicates before merging arrays
      const existingIds = new Set(existingPropertyArray.map((item) => item.id));
      const filteredNewItems = newItems.filter((item) => !existingIds.has(item.id));

      // Now combine the arrays without duplicates
      const combinedArray = [...existingPropertyArray, ...filteredNewItems];
      Wized.data.v.property_array = combinedArray;

      insertMixItemsIntoDOM();
      setPropertyLinks(); // Set href attributes with correct IDs and dynamic URL

      if (result.data.nextPage === null) {
        isEndReached = true;
        observer.disconnect();
      }

      reinitializeComponents();
      if (scrollLoadCount !== 3) {
        observeLastElement();
      }
    } catch (error) {
      // Optional error handling
    } finally {
      isLoading = false;
    }
  }
  // Observe DOM changes to reinitialize Swiper when necessary
  function observeDOMChanges() {
    const targetNode = document.querySelector(".properties_list");
    if (!targetNode) return;

    const config = { childList: true, subtree: true };

    const mutationObserver = new MutationObserver((mutationsList) => {
      // Temporarily disconnect to prevent infinite loop
      mutationObserver.disconnect();

      let significantChange = false;
      mutationsList.forEach((mutation) => {
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          significantChange = true;
        }
      });

      if (significantChange) {
        initSwiper();
      }

      // Reconnect the observer
      mutationObserver.observe(targetNode, config);
    });

    mutationObserver.observe(targetNode, config);
  }

  // Initialize the entire application
  (async () => {
    await checkInitialData();
    setupFilterClickListeners();
    initSwiper();
    observeLastElement();
    observeDOMChanges();
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
