'use client';

import { useEffect, useState } from 'react';
import { fetchStopTimes, fetchStops, fetchDisruptions } from '../services/api';

const Stop = ({ stopName, onBack }) => {
    const [stopCodes, setStopCodes] = useState([]);
    const [linesInfo, setLinesInfo] = useState({});
    const [error, setError] = useState(null);
    const [affectedLines, setAffectedLines] = useState([]);
    const [favorite, setFavorite] = useState(false);
    const [selectedDisruption, setSelectedDisruption] = useState(null);
    const [disruptionDetails, setDisruptionDetails] = useState(null);

    console.log(affectedLines);

    useEffect(() => {
        const fetchStopCodes = async () => {
            try {
                const stops = await fetchStops();
                const cleanedStopName = stopName?.trim().toLowerCase();
                const matchingCodes = stops
                    .filter(stop => stop.libelle.trim().toLowerCase() === cleanedStopName)
                    .map(stop => stop.codeLieu);

                const uniqueCodes = [...new Set(matchingCodes)];

                if (uniqueCodes.length === 0) {
                    setError('Arrêt non trouvé dans la base de données');
                    return;
                }

                setStopCodes(uniqueCodes);
            } catch (error) {
                console.error('Erreur lors de la récupération des codes:', error);
                setError('Erreur de traitement des données locales');
            }
        };

        fetchStopCodes();
    }, [stopName]);

    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorite(favorites.includes(stopName));
    }, [stopName]);

    const toggleFavorite = () => {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        let updatedFavorites;

        if (favorites.includes(stopName)) {
            updatedFavorites = favorites.filter(fav => fav !== stopName);
        } else {
            updatedFavorites = [...favorites, stopName];
        }

        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setFavorite(!favorite);
    };

    useEffect(() => {
        let intervalId;

        const fetchAllLinesInfo = async () => {
            const allLinesInfo = {};

            for (const code of stopCodes) {
                try {
                    const stopTimes = await fetchStopTimes(code);

                    stopTimes.forEach(item => {
                        const { numLigne } = item.ligne;
                        const terminus = item.terminus;
                        const temps = item.temps;

                        if (numLigne && terminus) {
                            const terminusName = terminus.trim();

                            if (!allLinesInfo[numLigne]) {
                                allLinesInfo[numLigne] = { terminusInfo: {} };
                            }

                            if (!allLinesInfo[numLigne].terminusInfo[terminusName]) {
                                allLinesInfo[numLigne].terminusInfo[terminusName] = [];
                            }

                            if (temps) {
                                const time = temps === 'proche' ? temps : (temps === "" ? "Inconnu" : parseInt(temps.match(/\d+/)?.[0], 10));
                                if (time === 'proche' || time === 'Inconnu' || !isNaN(time)) {
                                    allLinesInfo[numLigne].terminusInfo[terminusName].push(time);
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error(`Erreur lors de la récupération des lignes pour le code ${code}:`, error);
                }
            }

            const formattedLinesInfo = {};
            for (const line in allLinesInfo) {
                formattedLinesInfo[line] = { terminusInfo: {} };

                for (const terminus in allLinesInfo[line].terminusInfo) {
                    const validTimes = allLinesInfo[line].terminusInfo[terminus]
                        .filter(t => t === 'proche' || t === 'Inconnu' || !isNaN(t))
                        .sort((a, b) => {
                            if (a === 'proche') return -1; // 'proche' en premier
                            if (b === 'proche') return 1;
                            if (a === 'Inconnu') return 1; // 'Inconnu' à la fin
                            if (b === 'Inconnu') return -1;
                            return a - b; // Tri numérique pour les autres cas
                        });

                    if (validTimes.length > 0) {
                        formattedLinesInfo[line].terminusInfo[terminus] = validTimes[0];
                    }
                }

                const validTerminus = Object.values(formattedLinesInfo[line].terminusInfo).filter(t => t !== undefined);
                if (validTerminus.length === 0) {
                    delete formattedLinesInfo[line];
                }
            }

            setLinesInfo(formattedLinesInfo);
        };

        const fetchDisruptionsData = async () => {
            try {
                const disruptions = await fetchDisruptions();
                const affected = [];

                disruptions.forEach(disruption => {
                    affected.push(disruption.lineNumber);  // Récupère les numéros de ligne affectés
                });

                setAffectedLines(affected);
            } catch (error) {
                console.error('Erreur lors de la récupération des perturbations:', error);
            }
        };

        if (stopCodes.length > 0) {
            fetchAllLinesInfo();
            fetchDisruptionsData();
            intervalId = setInterval(fetchAllLinesInfo, 15000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [stopCodes]);

    const handleDisruptionClick = (line) => {
        const disruption = affectedLines.find(disruption => disruption.lineNumber === line);
        setDisruptionDetails(disruption ? disruption.details : null);
        setSelectedDisruption(line);
    };

    return (
        <div className="stop">
            <div className="presentation">
                <div className="infos">
                    <div className="name">
                        <h2>{stopName}</h2>
                    </div>
                    <div className="lines">
                        {error ? (
                            <p>{error}</p>
                        ) : (
                            Object.keys(linesInfo).length > 0 ? (
                                Object.keys(linesInfo).map((line, index) => (
                                    <img
                                        key={index}
                                        src={`../../pics/Picto ligne ${line}.svg`}
                                        alt={`Ligne ${line}`}
                                    />
                                ))
                            ) : (
                                <p>Aucune ligne disponible</p>
                            )
                        )}
                    </div>
                </div>
                <div className="favorite" onClick={toggleFavorite}>
                    <img src={favorite ? '../../Star_fill.svg' : '../../Star_light.svg'} alt="Favori" />
                </div>
            </div>
            {Object.keys(linesInfo).map((line, index) => (
                <div key={index} className="block-plus">
                    <div className="picinfos-plus">
                        <div className="pic">
                            <img src={`../../pics/Picto ligne ${line}.svg`} alt={`Ligne ${line}`} />
                        </div>
                        <div className="infos">
                            <h3>
                                {Object.keys(linesInfo[line].terminusInfo)
                                    .filter((_, idx) => idx < 2)
                                    .map((terminus, tIdx) => (
                                        <span key={tIdx}>
                                            &gt; {terminus}
                                            {tIdx < Object.keys(linesInfo[line].terminusInfo).length - 1 ? <br /> : null}
                                        </span>
                                    ))}
                            </h3>
                        </div>
                    </div>
                    <div className="times">
                        {Object.keys(linesInfo[line].terminusInfo).map((terminus, tIdx) => (
                            linesInfo[line].terminusInfo[terminus] && (
                                <div key={tIdx} className="times-child">
                                    <p>
                                        {linesInfo[line].terminusInfo[terminus] === 'proche'
                                            ? 'Proche'
                                            : linesInfo[line].terminusInfo[terminus] === 'Inconnu'
                                                ? 'Inconnu'
                                                : `${linesInfo[line].terminusInfo[terminus]} min`
                                        }
                                    </p>
                                    <img src="../../icon_rt.svg" alt="Refresh Icon" />
                                </div>
                            )
                        )).slice(0, 2)}
                    </div>
                    {affectedLines.includes(line) && (
                        <div className="alerte" onClick={() => {
                            console.log("Alerte cliquée pour la ligne:", line);
                            setSelectedDisruption(line);
                        }}>
                            !
                        </div>

                    )}
                </div>
            ))}
            <button className="button-back" onClick={onBack}>Retour</button>

            {selectedDisruption && (
                <div className="modal-overlay" onClick={() => setSelectedDisruption(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Perturbation sur la ligne {selectedDisruption}</h3>
                        <button onClick={() => setSelectedDisruption(null)}>Fermer</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Stop;
