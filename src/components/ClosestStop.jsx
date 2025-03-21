'use client';

import { useEffect, useState } from 'react';
import { fetchStops } from '../services/api';

const ClosestStop = ({ stopNames, onBack, clickOnStop }) => {
    const [stopData, setStopData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStopCodes = async () => {
            setError(null); // Réinitialiser l'erreur à chaque nouvelle tentative
            setStopData([]); // Réinitialiser les données

            try {
                const stops = await fetchStops();
                // Convertir stopNames en une liste d'objets avec un libellé et une distance
                const stopMap = stopNames.map(stop => ({
                    libelle: stop.libelle.trim().toLowerCase(),
                    distance: stop.distance
                }));

                // Créer un tableau pour conserver les arrêts triés dans l'ordre
                const orderedStops = stopNames.map((stop) => {
                    // Rechercher l'arrêt dans les données récupérées
                    const stopFound = stops.find((fetchedStop) => fetchedStop.libelle.trim().toLowerCase() === stop.libelle.trim().toLowerCase());
                    if (stopFound) {
                        return {
                            name: stopFound.libelle,
                            distance: stop.distance,
                            lines: stopFound.ligne || [] // Si des lignes sont présentes
                        };
                    }
                    return null;
                }).filter(stop => stop !== null); // Filtrer les arrêts non trouvés

                if (orderedStops.length === 0) {
                    setError('Aucun arrêt trouvé dans la base de données');
                    return;
                }

                setStopData(orderedStops); // Mettre à jour les données des arrêts
            } catch (error) {
                console.error('Erreur lors de la récupération des arrêts:', error);
                setError('Erreur de traitement des données locales');
            }
        };

        fetchStopCodes();
    }, [stopNames]);

    return (
        <div className="stop-container">
            {error ? (
                <p>{error}</p>
            ) : (
                stopData.map((stop, index) => (
                    <div key={index} className="closeststops">
                        <div className="itemStop" onClick={() => clickOnStop(stop.name)}>
                            <div className="name">
                                <h2>{stop.name}</h2>
                                <p>{stop.distance}</p>
                                <img src="../../arrow-right.svg" alt=""/>
                            </div>
                            <div className="lines">
                                {stop.lines.length > 0 ? (
                                    stop.lines.map((line, index) => (
                                        <div key={index} className="line-info">
                                            <img
                                                src={`../../pics/Picto ligne ${line.numLigne}.svg`}
                                                alt={`Ligne ${line.numLigne}`}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p>Les pictogrammes de lignes sont en attente...</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ClosestStop;
