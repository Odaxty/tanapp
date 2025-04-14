'use client';

import { useEffect, useState } from 'react';
import { fetchStopTimes, fetchStops, fetchDisruptions } from '../services/api';
import Horaires from "@/components/Horaires";

const Stop = ({ stopName, onBack }) => {
    const [stopCodes, setStopCodes] = useState([]);
    const [linesInfo, setLinesInfo] = useState({});
    const [error, setError] = useState(null);
    const [affectedLines, setAffectedLines] = useState([]);
    const [favorite, setFavorite] = useState(false);
   // const [selectedDisruption, setSelectedDisruption] = useState(null);
    const [disruptionDetails, setDisruptionDetails] = useState(null);
    const [favoriteLines, setFavoriteLines] = useState({});
    const [selectedLine, setSelectedLine] = useState(null);
    const [disruptions, setDisruptions] = useState({});
    const [selectedDisruption, setSelectedDisruption] = useState({
        line: null,
        index: 0
    });


    // console.log(linesInfo);

   // const [disruptions, setDisruptions] = useState([]);

    useEffect(() => {
        const loadDisruptions = async () => {
            const data = await fetchDisruptions();
            setDisruptions(data);
        };
        loadDisruptions();
    }, []);

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
        const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || {};
        setFavoriteLines(savedFavorites[stopName] || {}); // permet d'afficher els lignes déja mis en favorits
    }, [stopName]);

    const toggleFavorite = (line) => {
        const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || {};

        // Récupérer les favoris de l'arrêt actuel
        const stopFavorites = savedFavorites[stopName] || {};

        // Basculer l'état de la ligne (ajouter/supprimer)
        if (stopFavorites[line]) {
            delete stopFavorites[line]; // Supprimer la ligne si déjà favori
        } else {
            stopFavorites[line] = true; // Ajouter comme favori
        }

        // Si plus aucune ligne dans l'arrêt, on supprime l'arrêt complètement
        if (Object.keys(stopFavorites).length === 0) {
            delete savedFavorites[stopName];
        } else {
            savedFavorites[stopName] = stopFavorites; // Sinon, on garde l'arrêt mis à jour
        }

        // Mise à jour du localStorage
        localStorage.setItem('favorites', JSON.stringify(savedFavorites));

        // Mise à jour de l'état React
        setFavoriteLines(savedFavorites[stopName] || {}); // Pour rafraîchir les lignes affichées
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
                                let time = "Inconnu"; // Valeur par défaut

                                if (temps === "proche") {
                                    time = "proche";
                                } else if (temps.trim() !== "") {
                                    const match = temps.match(/\d+/); // Récupère le premier nombre trouvé
                                    time = match ? parseInt(match[0], 10) : temps; // Convertit en entier si un nombre est trouvé
                                }

                                console.log(time);
                                allLinesInfo[numLigne].terminusInfo[terminusName].push(time);
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
                    console.log("Debug - Temps avant filtrage:", allLinesInfo[line].terminusInfo[terminus]);
                    const validTimes = allLinesInfo[line].terminusInfo[terminus]
                        .filter(t => t === 'proche' || t === 'Inconnu' || (typeof t === 'number' && !isNaN(t)))
                        .sort((a, b) => {
                            if (a === 'proche') return -1; // 'proche' en premier
                            if (b === 'proche') return 1;
                            if (a === 'Inconnu') return 1; // 'Inconnu' à la fin
                            if (b === 'Inconnu') return -1;
                            return a - b; // Tri numérique pour les autres cas
                        });

                    if (validTimes.length === 0) validTimes.push("Inconnu");

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
                                <p><img src="../../wait.svg" /></p>
                            )
                        )}
                    </div>
                </div>
            </div>
            {Object.keys(linesInfo).map((line, index) => (
                <div key={index} className="block-plus"  onClick={() => setSelectedLine(line)}>
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
                            // console.log("Alerte cliquée pour la ligne:", line);
                            const disruptionDetails = disruptions.find(d => d.lineNumber === line)?.details || {};
                            setSelectedDisruption({ line, ...disruptionDetails });
                        }}>
                            !
                        </div>

                    )}
                    {disruptions[line] && disruptions[line].length > 0 && (
                        <div className="alerte" onClick={() => {
                            setSelectedDisruption({
                                line: line,
                                index: 0
                            });
                        }}>
                            !
                        </div>
                    )}
                    {/* Étoile pour chaque ligne */}
                    <div className="favorite" onClick={() => toggleFavorite(line)}>
                        <img
                            src={favoriteLines[line] ? '../../Star_fill.svg' : '../../Star_light.svg'}
                            alt="Favori"
                            style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                        />
                    </div>

                </div>
            ))}
            <button className="button-back" onClick={onBack}>Retour</button>

            {selectedDisruption.line && disruptions[selectedDisruption.line] && (
                <div className="modal-overlay" onClick={() => setSelectedDisruption({ line: null, index: 0 })}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Perturbation sur la ligne <img
                            src={"../../pics/Picto ligne " + selectedDisruption.line + ".svg"} alt="" />
                            ({selectedDisruption.index + 1}/{disruptions[selectedDisruption.line].length})
                        </h3>

                        <div className="date">
                            <p><strong>Début
                                :</strong> {disruptions[selectedDisruption.line][selectedDisruption.index].date_debut} {" à "} {disruptions[selectedDisruption.line][selectedDisruption.index].heure_debut}
                            </p>
                            <p><strong>Fin
                                :</strong> {disruptions[selectedDisruption.line][selectedDisruption.index].date_fin} {" à "} {disruptions[selectedDisruption.line][selectedDisruption.index].heure_fin}
                            </p>
                        </div>

                        <p className="title"><strong>Intitulé :</strong>
                            {disruptions[selectedDisruption.line][selectedDisruption.index].intitule || "Non disponible"}
                        </p>

                        <div className="resume">
                            <p><strong>Résumé
                                :</strong> {disruptions[selectedDisruption.line][selectedDisruption.index].resume || "Non disponible"}
                            </p>
                        </div>

                        <div className="navigation-buttons">
                            {disruptions[selectedDisruption.line].length > 1 && selectedDisruption.index > 0 && (
                                <button className="prev-button" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDisruption(prev => ({
                                        ...prev,
                                        index: prev.index - 1
                                    }));
                                }}>
                                    Précédent
                                </button>
                            )}

                            {disruptions[selectedDisruption.line].length > 1 && selectedDisruption.index < disruptions[selectedDisruption.line].length - 1 && (
                                <button className="next-button" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDisruption(prev => ({
                                        ...prev,
                                        index: prev.index + 1
                                    }));
                                }}>
                                    Suivant
                                </button>
                            )}
                        </div>

                        <button className="close-button" onClick={() => setSelectedDisruption({ line: null, index: 0 })}>
                            <img src="../../arrow-right.svg" alt="" />
                        </button>
                    </div>
                </div>
            )}

            {selectedLine && (
                <div className="horaires-container">
                    <Horaires stopCode={stopCodes} ligne={selectedLine} sens={1} />

                </div>
            )}



        </div>
    );
};

export default Stop;
