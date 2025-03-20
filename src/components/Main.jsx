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
    }, [location.latitude, location.longitude]); // Ajout des propriétés `latitude` et `longitude` comme dépendances

    return (
        <div>
            <SearchBar setSelectedStop={setSelectedStop} />
            <div className="home-page">
                {!selectedStop && <h1 className="title">Arrêts favoris</h1>}

                {selectedStop ? (
                    <Stop stopName={selectedStop} onBack={() => setSelectedStop(null)} />
                ) : (
                    <Favorite />
                )}
            </div>
            <div>
                <ClosestStop stopNames={closestStops} onBack={() => setSelectedStop(null)} />
            </div>
        </div>
    );
};

export default Main;
