'use client';

import { useEffect, useState } from 'react';
import { fetchStops } from '../services/api';

const ClosestStop = ({ stopNames, onBack, clickOnStop, geoError, retryGeolocation }) => {
    const [stopData, setStopData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStopCodes = async () => {
            setError(null);
            setStopData([]);

            try {
                const stops = await fetchStops();

                const stopMap = stopNames.map(stop => ({
                    libelle: stop.libelle.trim().toLowerCase(),
                    distance: stop.distance
                }));

                const orderedStops = stopNames.map((stop) => {
                    const stopFound = stops.find((fetchedStop) =>
                        fetchedStop.libelle.trim().toLowerCase() === stop.libelle.trim().toLowerCase()
                    );
                    if (stopFound) {
                        return {
                            name: stopFound.libelle,
                            distance: stop.distance,
                            lines: stopFound.ligne || []
                        };
                    }
                    return null;
                }).filter(stop => stop !== null);

                if (orderedStops.length === 0) {
                    setError('Aucun arrêt trouvé dans la base de données');
                    return;
                }

                setStopData(orderedStops);
            } catch (error) {
                console.error('Erreur lors de la récupération des arrêts:', error);
                setError('Erreur de traitement des données locales');
            }
        };

        if (!geoError && stopNames.length > 0) {
            fetchStopCodes();
        }
    }, [stopNames, geoError]);

    return (
        <div className="stop-container">
            {geoError ? (
                <div className="geo-error">
                    <p>📍 L’accès à la géolocalisation est désactivé ou a été refusé.</p>
                    <button onClick={retryGeolocation}>Redemander l'accès</button>
                </div>
            ) : stopData.length === 0 ? (
                <p>Chargement des arrêts proches...</p>
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
