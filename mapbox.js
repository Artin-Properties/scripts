// Fetch the Mapbox token from your backend
async function initializeMap() {
  try {
    const version = window.location.href.includes("artin-properties.webflow.io") ? "v1.4" : "v1.3";
    const dataSource = window.location.href.includes("artin-properties.webflow.io")
      ? "staging"
      : "";

    const response = await fetch(`https://api.artinproperties.ca/api:iwYORZ6t/map/token`, {
      headers: {
        "X-Branch": version,
        "X-Data-Source": dataSource,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch Mapbox token");
    }
    const data = await response.json();
    if (!data.token) {
      throw new Error("Invalid token response");
    }
    mapboxgl.accessToken = data.token;

    const map = new mapboxgl.Map({
      container: "map", // ID of the div to render the map in
      // style: "mapbox://styles/blackpeakbp/cm2jfprjq007f01py5z2g8h1w/draft", // Map style
      center: [-123.068645, 49.239609], // Starting position [lng, lat]
      zoom: 9, // Starting zoom
    });

    // Load custom icon for individual properties
    map.on("load", () => {
      map.loadImage(
        "https://cdn.prod.website-files.com/65ca509f965a4d9aaf54474f/671968afd2c8edd104402d26_property-icon.png",
        async (error, image) => {
          if (error) {
            console.error("Error loading image:", error);
            return; // Exit if there's an error loading the image
          }

          console.log("Image loaded successfully:", image);
          map.addImage("property-icon", image); // Add individual property icon

          const data = await fetch(`https://api.artinproperties.ca/api:iwYORZ6t/map/properties`, {
            headers: {
              "X-Branch": version,
              "X-Data-Source": dataSource,
            },
          });

          console.log(data);

          // Add a GeoJSON source with clustering enabled
          map.addSource("locations", {
            type: "geojson",
            data: data,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 37.5,
          });

          // Layer for clustered points using default circle icons
          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "locations",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#FFFFFF",
              "circle-radius": ["step", ["get", "point_count"], 15, 7.5, 22.5, 15, 30, 22.5, 37.5],
            },
          });

          // Layer for cluster count labels
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "locations",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 22,
              "text-offset": [0, 0],
              "text-anchor": "center",
            },
            paint: {
              "text-color": "#000000",
            },
          });

          // Layer for unclustered points using the custom property icon
          map.addLayer({
            id: "unclustered-point",
            type: "symbol",
            source: "locations",
            filter: ["!", ["has", "point_count"]],
            layout: {
              "icon-image": "property-icon",
              "icon-size": 0.375,
            },
          });

          // Function to handle displaying the modal
          const showModal = async (e) => {
            if (e.features.length > 0) {
              const properties = e.features[0].properties;

              try {
                const property = await fetch(
                  `https://api.artinproperties.ca/api:iwYORZ6t/map/property?id=${properties.id}`,
                  {
                    headers: {
                      "X-Branch": version,
                      "X-Data-Source": dataSource,
                    },
                  }
                );
                const propertyData = await property.json();

                // Set modal content
                document.querySelector('[wized="map_PropertyTitle"]').textContent =
                  propertyData.name || "No Title";
                const imageElement = document.querySelector('[wized="map_PropertyImageSrc"]');
                imageElement.src = propertyData.meta_image?.url || ""; // Set image src

                // Format and set start and end dates using Moment.js
                const formattedStartDate = moment(propertyData.avail_start_date).format("MMM Do");
                const formattedEndDate = moment(propertyData.avail_end_date).format("MMM Do");
                document.querySelector('[wized="map_PropertyAvailableFrom"]').textContent =
                  `${formattedStartDate} - ${formattedEndDate}` || "N/A";

                // Set other property details
                document.querySelector('[wized="map_PropertyGuestCount"]').textContent =
                  propertyData.personCapacity || "N/A";
                document.querySelector('[wized="map_PropertyBedCount"]').textContent =
                  propertyData.bedroomsNumber || "N/A";
                document.querySelector('[wized="map_PropertyBathCount"]').textContent =
                  propertyData.bathroomsNumber || "N/A";
                document.querySelector('[wized="map_PropertyLocation"]').textContent =
                  propertyData.city || "No City";

                // Determine and display price based on rental type
                const priceElement = document.querySelector('[wized="map_PropertyPrice"]');
                const rentalType = propertyData.rental_type;

                if (rentalType === "MTR" || rentalType === "LTR") {
                  // Multiply nightly cost by 30 for monthly rate
                  const monthlyPrice = propertyData.price * 30;
                  priceElement.textContent = `$${monthlyPrice.toLocaleString()}/month`;
                } else {
                  // Default to nightly rate
                  priceElement.textContent = `$${propertyData.price.toLocaleString()}/night`;
                }

                document.querySelector('[wized="map-modal-link"]').href =
                  `/property?property=${propertyData.id}`;

                document.querySelector('[wized="map-modal-link"]').target = "_blank";

                // Logic to set display propertyData for tags
                const shortTag = document.querySelector('[wized="home_PropertyTagShort"]');
                const monthTag = document.querySelector('[wized="home_PropertyTagMonth"]');
                const longTag = document.querySelector('[wized="home_PropertyTagLong"]');
                const artinTag = document.querySelector('[wized="home_PropertyTagArtin"]');
                const artinTagText = document.querySelector('[wized="home_PropertyTagArtinText"]');
                const newTag = document.querySelector('[wized="home_PropertyTagNew"]');

                shortTag.style.display = "none";
                monthTag.style.display = "none";
                longTag.style.display = "none";
                artinTag.style.display = "none";
                newTag.style.display = "none";

                if (rentalType === "STR") {
                  shortTag.style.display = "flex";
                } else if (rentalType === "MTR") {
                  monthTag.style.display = "flex";
                } else if (rentalType === "LTR") {
                  longTag.style.display = "flex";
                }

                if (propertyData.artin_status && propertyData.artin_status.trim() !== "") {
                  artinTag.style.display = "flex";
                  artinTagText.textContent = propertyData.artin_status;
                }

                if (propertyData.new === true) {
                  newTag.style.display = "flex";
                }

                const modal = document.getElementById("property-modal");
                modal.style.display = "block";
                setTimeout(() => {
                  modal.style.opacity = 1;
                }, 10);

                const coordinates = [
                  propertyData.coordinates.data.lng,
                  propertyData.coordinates.data.lat,
                ];

                const pinCoordinates = map.project(coordinates);
                modal.style.left = `${pinCoordinates.x - modal.offsetWidth / 2}px`;
                modal.style.top = `${pinCoordinates.y + 20}px`;
              } catch (error) {
                console.error("Error fetching property data:", error);
              }
            }
          };

          const closeModal = () => {
            const modal = document.getElementById("property-modal");
            const imageElement = document.querySelector('[wized="map_PropertyImageSrc"]');
            imageElement.src = "";
            modal.style.opacity = 0;
            setTimeout(() => {
              modal.style.display = "none";
            }, 500);
          };

          const isMobile = /Mobi|Android/i.test(navigator.userAgent);
          if (isMobile) {
            map.on("click", "unclustered-point", showModal);
            map.on("movestart", closeModal);
            map.getCanvas().addEventListener("touchstart", (e) => {
              const modal = document.getElementById("property-modal");
              if (!modal.contains(e.target)) {
                closeModal();
              }
            });
          } else {
            map.on("click", "unclustered-point", showModal);
            map.on("movestart", closeModal);

            map.on("click", "cluster-count", (e) => {
              if (!e.features.length) return;

              const cluster = e.features[0];
              const clusterId = cluster.properties.cluster_id;
              const source = map.getSource("locations"); // Replace 'locations' with your source id

              // Get the zoom level at which the cluster expands
              source.getClusterExpansionZoom(clusterId, function (err, expansionZoom) {
                if (err) return;

                // Optionally, adjust the zoom level (for example, adding a bit more zoom)
                map.easeTo({
                  center: cluster.geometry.coordinates,
                  zoom: expansionZoom,
                });
              });
            });
          }

          const modal = document.getElementById("property-modal");
          modal.addEventListener("mouseenter", () => {
            modal.style.display = "block";
          });
          modal.addEventListener("mouseleave", closeModal);

          map.on("mouseenter", "unclustered-point", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "unclustered-point", () => {
            map.getCanvas().style.cursor = "";
          });

          map.on("mouseenter", "cluster-count", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "cluster-count", () => {
            map.getCanvas().style.cursor = "";
          });
        }
      );
    });
  } catch (error) {
    console.error("Error initializing map:", error);
  }
}

initializeMap();
