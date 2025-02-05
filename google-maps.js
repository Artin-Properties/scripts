window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
    window.initMap = function(latitude, longitude) {
        console.log("Raw latitude:", latitude, "Raw longitude:", longitude); // Debug log

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (!isNaN(latitude) && !isNaN(longitude)) {
            if (!window.google || !window.google.maps) {
                console.error('Google Maps API is not loaded');
                return;
            }

            const mapOptions = {
                center: new google.maps.LatLng(latitude, longitude),
                zoom: 12,
                styles: [
                    {
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#212121"
                            }
                        ]
                    },
                    {
                        "elementType": "labels.icon",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#757575"
                            }
                        ]
                    },
                    {
                        "elementType": "labels.text.stroke",
                        "stylers": [
                            {
                                "color": "#212121"
                            }
                        ]
                    },
                    {
                        "featureType": "administrative",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#757575"
                            }
                        ]
                    },
                    {
                        "featureType": "administrative.country",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#9e9e9e"
                            }
                        ]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#212121"
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#212121"
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#757575"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#424242"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#757575"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#000000"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#3d3d3d"
                            }
                        ]
                    }
                ]
            };

            const mapDiv = document.getElementById('googleMap');
            if (!mapDiv) {
                console.error('Map div not found');
                return;
            }
            const map = new google.maps.Map(mapDiv, mapOptions);

            // Add a white marker to represent the location
            const marker = new google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: map,
                title: 'Location',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#FFFFFF',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeOpacity: 1,
                    strokeWeight: 2,
                    scale: 10 // Adjust the size of the marker
                }
            });
        } else {
            console.error('Latitude or Longitude is not a number:', latitude, longitude);
        }
    };

    // Wait for Google Maps API to load before attempting to fetch and initialize the map
    function waitForGoogleMapsAPI() {
        if (window.google && window.google.maps) {
            fetchPropertyData();
        } else {
            console.error('Waiting for Google Maps API to load');
            setTimeout(waitForGoogleMapsAPI, 1000); // Check every second
        }
    }

    // Function to fetch property data and initialize map
    async function fetchPropertyData() {
        try {
            const result = await Wized.requests.waitFor('Get_Property'); // Wait for the request to complete
            if (result.ok) {
                const latitude = result.data.coordinates.data.lat;
                const longitude = result.data.coordinates.data.lng;
                initMap(latitude, longitude);
            } else {
                console.error('Failed to fetch location data:', result.statusText);
            }
        } catch (error) {
            console.error('There was an error executing the request:', error);
        }
    }

    waitForGoogleMapsAPI(); // Start waiting for the API to load
});