'use client';

import { useEffect, useState } from 'react';
import { fetchStops } from '../services/api';

const ClosestStop = ({ stopNames, onBack }) => {
    const [stopData, setStopData] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStopCodes = async () => {
            setError(null); // Reset de l'erreur à chaque refresh
            setStopData({}); // Réinitialisation des données

            try {
                const stops = await fetchStops();
                const cleanedStopNames = stopNames.map(name => name.trim().toLowerCase());
                const stopMap = {};

                stops.forEach(stop => {
                    const stopName = stop.libelle.trim().toLowerCase();
                    if (cleanedStopNames.includes(stopName)) {
                        stopMap[stop.codeLieu] = {
                            name: stop.libelle,
                            lines: stop.ligne || [] // Utilisation des lignes si disponibles
                        };
                    }
                });

                if (Object.keys(stopMap).length === 0) {
                    setError('Aucun arrêt trouvé dans la base de données');
                    return;
                }

                // Vérifier si certaines lignes sont manquantes et relancer la requête
                for (const code in stopMap) {
                    if (stopMap[code].lines.length === 0) {
                        // Si aucune ligne n'est disponible, relancer la requête
                        console.log(`Relance de la requête pour l'arrêt ${stopMap[code].name}`);
                        const updatedStops = await fetchStops(); // Relancer la requête pour obtenir les lignes
                        const updatedStopMap = {};

                        updatedStops.forEach(stop => {
                            const stopName = stop.libelle.trim().toLowerCase();
                            if (cleanedStopNames.includes(stopName)) {
                                updatedStopMap[stop.codeLieu] = {
                                    name: stop.libelle,
                                    lines: stop.ligne || []
                                };
                            }
                        });

                        // Mettre à jour les données de l'arrêt avec les nouvelles lignes
                        setStopData(updatedStopMap);
                        return; // Terminer la fonction pour éviter un rendu supplémentaire avant la mise à jour
                    }
                }

                // Si toutes les lignes sont présentes, mettre à jour les données
                setStopData(stopMap);
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
                Object.keys(stopData).map((code) => (
                    <div key={code} className="stop">
                        <div className="infos">
                            <div className="name">
                                <h2>{stopData[code].name}</h2>
                            </div>
                            <div className="lines">
                                {stopData[code].lines.length > 0 ? (
                                    stopData[code].lines.map((line, index) => (
                                        <div key={index} className="line-info">
                                            <img
                                                src={`../../pics/Picto ligne ${line.numLigne}.svg`} // Utilisation de line.numLigne si line est un objet
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
            <button className="button-back" onClick={onBack}>Retour</button>
        </div>
    );
};

export default ClosestStop;
