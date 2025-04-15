import { useState, useEffect } from 'react';
import SearchBar from "@/components/SearchBar";
import Stop from '@/components/Stop';
import Favorite from '@/components/Favorite';
import { fetchClosestStops } from "@/services/api";
import ClosestStop from "@/components/ClosestStop";

const Main = () => {
    const [closestStops, setClosestStops] = useState([]);
    const [selectedStop, setSelectedStop] = useState(null);
    const [location, setLocation] = useState({ latitude: null, longitude: null });

    const [isSearching, setIsSearching] = useState(false);
    const [isClosestStopClicked, setIsClosestStopClicked] = useState(false);
    const [isFavoriteClicked, setIsFavoriteClicked] = useState(true);
    const [geoError, setGeoError] = useState(false); // Nouvel état pour l'erreur de géolocalisation

    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    setGeoError(false);
                    const { latitude, longitude } = position.coords;
                    if (latitude !== location.latitude || longitude !== location.longitude) {
                        setLocation({ latitude, longitude });
                        const stops = await fetchClosestStops(latitude, longitude);
                        setClosestStops(stops);
                    }
                },
                (error) => {
                    console.log("Erreur de géolocalisation:", error);
                    setGeoError(true);
                    setClosestStops([]);
                }
            );
        } else {
            console.log("La géolocalisation n'est pas supportée par ce navigateur.");
            setGeoError(true);
        }
    };

    // Écoute le changement de permission de géolocalisation
    useEffect(() => {
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                result.onchange = () => {
                    if (result.state === 'granted') {
                        updateLocation(); // relance automatique
                    }
                };
            });
        }
    }, []);

    useEffect(() => {
        updateLocation();
        const interval = setInterval(updateLocation, 15000);
        return () => clearInterval(interval);
    }, [location.latitude, location.longitude]);

    const handleSearchClick = () => {
        setIsSearching(true);
        setIsClosestStopClicked(false);
        setIsFavoriteClicked(false);
    };

    const handleClosestStopClick = () => {
        setIsSearching(false);
        setIsClosestStopClicked(true);
        setIsFavoriteClicked(false);
    };

    const handleFavoriteClick = () => {
        setIsSearching(false);
        setIsClosestStopClicked(false);
        setIsFavoriteClicked(true);
    };

    const handleSearchStop = (stopName) => {
        setSelectedStop(stopName);
        setIsClosestStopClicked(false);
        setIsFavoriteClicked(false);
    };

    const clickOnStop = (nameStop) => {
        setIsFavoriteClicked(false);
        handleSearchStop(nameStop);
    };

    return (
        <div>
            <SearchBar
                handleSearchStop={handleSearchStop}
                onSearchClick={handleSearchClick}
                setIsFavoriteClicked={handleFavoriteClick}
                onBack={() => {
                    setSelectedStop(null);
                    handleFavoriteClick();
                }}
                handleClosestStopClick={handleClosestStopClick}
                handleFavoriteClick={handleFavoriteClick}
            />

            {isFavoriteClicked && (
                <div className="home-page">
                    <Favorite
                        setSelectedStop={setSelectedStop}
                        clickOnStop={clickOnStop}
                    />
                </div>
            )}

            {isClosestStopClicked && (
                <div className="home-page">
                    <h1 className="title">Arrêts les plus proches</h1>
                    <ClosestStop
                        stopNames={closestStops}
                        onBack={() => setIsClosestStopClicked(false)}
                        clickOnStop={clickOnStop}
                        geoError={geoError}
                        retryGeolocation={updateLocation}
                    />
                </div>
            )}

            {isSearching && !selectedStop && (
                <div className="home-page">
                    <h1 className="title">Rechercher un arrêt</h1>
                    <SearchBar
                        setSelectedStop={setSelectedStop}
                        onSearchClick={handleSearchClick}
                        setIsFavoriteClicked={handleFavoriteClick}
                        handleClosestStopClick={handleClosestStopClick}
                        onBack={() => setSelectedStop(null)}
                    />
                </div>
            )}

            {selectedStop && !isSearching && !isClosestStopClicked && !isFavoriteClicked && (
                <Stop stopName={selectedStop} onBack={() => setSelectedStop(null)} />
            )}
        </div>
    );
};

export default Main;
