'use client';
import { useState, useEffect } from 'react';
import SearchBar from "@/components/SearchBar";
import Stop from '@/components/Stop';
import Favorite from '@/components/Favorite';
import { fetchClosestStops } from "@/services/api";
import ClosestStop from "@/components/ClosestStop";
import AllLines from "@/components/AllLines";

const Main = () => {
    const [closestStops, setClosestStops] = useState([]); // Liste des arrêts les plus proches
    const [selectedStop, setSelectedStop] = useState(null);
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [isSearchClicked, setIsSearchClicked] = useState(false); // Etat pour savoir si le bouton a été cliqué
    const [isFavorite, setIsFavorite] = useState(true); // Etat pour gérer l'icône du bouton (location ou favorite)

    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    // Vérification si les nouvelles coordonnées sont différentes
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
    }, [location.latitude, location.longitude]); // Ajout des propriétés latitude et longitude comme dépendances

    // Fonction pour gérer le clic sur le bouton de recherche
    const handleSearchClick = () => {
        if (isSearchClicked) {
            setIsSearchClicked(false); // Si on clique à nouveau, on revient aux favoris
            setIsFavorite(true); // Affiche le SVG 'favorite.svg' lorsque les favoris sont affichés
        } else {
            setIsSearchClicked(true); // Lorsque le bouton est cliqué la première fois, on affiche ClosestStop
            setIsFavorite(false); // Affiche le SVG 'location.svg' lorsque ClosestStop est affiché
        }
    };

    return (
        <div>
            <SearchBar setSelectedStop={setSelectedStop} onSearchClick={handleSearchClick} isFavorite={isFavorite} />
            <div className="home-page">
                {!selectedStop && !isSearchClicked && <h1 className="title">Arrêts favoris</h1>}

                {selectedStop ? (
                    <Stop stopName={selectedStop} onBack={() => setSelectedStop(null)} />
                ) : (
                    !isSearchClicked && <Favorite />
                )}
            </div>
            <div>
                {isSearchClicked && (
                    <div className="home-page">
                        <h1 className="title">Arrêts les plus proches</h1>
                        <ClosestStop stopNames={closestStops} onBack={() => setIsSearchClicked(false)}/>
                    </div>
                )}
            </div>
            <AllLines/>
        </div>
    );
};

export default Main;
