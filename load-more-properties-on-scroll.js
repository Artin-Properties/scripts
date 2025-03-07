let scrollLoadCount = 0;

// Observe the last property item for lazy loading
function observeLastElement() {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoading && !isEndReached && scrollLoadCount < 3) {
          loadMoreItems();
          scrollLoadCount++;
        }
        if (scrollLoadCount === 3) {
          const showMoreBtn = document.getElementById("showMore");
          if (showMoreBtn) {
            showMoreBtn.style.display = "block";
          }
          observer.disconnect();
        }
      });
    },
    { root: null, rootMargin: "0px", threshold: 0.9 }
  );

  const items = document.querySelectorAll(".properties_list .properties_item");
  if (items.length > 0) {
    observer.observe(items[items.length - 1]);
  }
}
