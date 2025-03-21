'use client';
import { useState, useEffect } from 'react';
import SearchBar from "@/components/SearchBar";
import Stop from '@/components/Stop';
import Favorite from '@/components/Favorite';
import { fetchClosestStops } from "@/services/api";
import ClosestStop from "@/components/ClosestStop";

const Main = () => {
    const [closestStops, setClosestStops] = useState([]); // Liste des arrêts les plus proches
    const [selectedStop, setSelectedStop] = useState(null);
    const [location, setLocation] = useState({ latitude: null, longitude: null });

    // Variables d'état distinctes pour chaque mode
    const [isSearching, setIsSearching] = useState(false); // Mode recherche
    const [isClosestStopClicked, setIsClosestStopClicked] = useState(false); // Mode arrêts proches
    const [isFavoriteClicked, setIsFavoriteClicked] = useState(true); // Mode favoris

    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    if (latitude !== location.latitude || longitude !== location.longitude) {
                        setLocation({ latitude, longitude }); // Mise à jour des coordonnées

                        // Appel à fetchClosestStops pour récupérer une liste d'arrêts
                        const stops = await fetchClosestStops(latitude, longitude);
                        setClosestStops(stops); // Met à jour la liste des arrêts les plus proches
                    }
                },
                (error) => {
                    console.error("Erreur de géolocalisation:", error);
                }
            );
        } else {
            console.error("La géolocalisation n'est pas supportée par ce navigateur.");
        }
    };

    useEffect(() => {
        updateLocation();
        const interval = setInterval(updateLocation, 15000); // Mise à jour toutes les 15 secondes

        return () => clearInterval(interval); // Nettoyage de l'intervalle
    }, [location.latitude, location.longitude]);

    // Gère l'état de la recherche
    const handleSearchClick = () => {
        setIsSearching(true);
        setIsClosestStopClicked(false);
        setIsFavoriteClicked(false);
    };

    // Gère l'état des arrêts les plus proches
    const handleClosestStopClick = () => {
        setIsSearching(false);
        setIsClosestStopClicked(true);
        setIsFavoriteClicked(false);
        console.log('closest Stops')
    };

    // Gère l'état des favoris
    const handleFavoriteClick = () => {
        setIsSearching(false);
        setIsClosestStopClicked(false);
        setIsFavoriteClicked(true);
        console.log('favorite')
    };

    const handleSearchStop = (stopName) => {
        setSelectedStop(stopName)
        setIsClosestStopClicked(false);
        setIsFavoriteClicked(false);
    };

    const clickOnStop = (nameStop) => {
        setIsFavoriteClicked(false);  // Désactivation des favoris
        handleSearchStop(nameStop);  // Sélectionner l'arrêt
    };

    return (
        <div>
            <SearchBar
                handleSearchStop={handleSearchStop}
                onSearchClick={handleSearchClick}
                setIsFavoriteClicked={handleFavoriteClick}
                onBack={() => {
                    setSelectedStop(null);
                    handleFavoriteClick()
                }}
                handleClosestStopClick={handleClosestStopClick}
                handleFavoriteClick={handleFavoriteClick}
            />

            {/* Si isFavoriteClicked est true, on affiche Favorite */}
            {isFavoriteClicked && (
                <div className="home-page">
                    <Favorite
                        setSelectedStop={setSelectedStop}
                        clickOnStop={clickOnStop}
                    />
                </div>
            )}

            {/* Si isClosestStopClicked est true, on affiche ClosestStop */}
            {isClosestStopClicked && (
                <div className="home-page">
                    <h1 className="title">Arrêts les plus proches</h1>
                    <ClosestStop
                        stopNames={closestStops}
                        onBack={() => setIsClosestStopClicked(false)}
                        clickOnStop={clickOnStop}
                    />
                </div>
            )}

            {/* Si isSearching est true et qu'il n'y a pas de stop sélectionné, on affiche SearchBar */}
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

            {/* Si un stop est sélectionné, on affiche Stop */}
            {selectedStop && !isSearching && !isClosestStopClicked && !isFavoriteClicked && (
                <Stop stopName={selectedStop} onBack={() => setSelectedStop(null)} />
            )}
        </div>
    );
};

export default Main;
