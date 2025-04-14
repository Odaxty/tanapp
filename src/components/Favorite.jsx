'use client';

import { useEffect, useState } from 'react';
import { fetchStops, fetchStopTimes, fetchDisruptions } from '../services/api';

const Favorite = ({ clickOnStop }) => {
    const [favorites, setFavorites] = useState([]);
    const [favoriteInfos, setFavoriteInfos] = useState({});
    const [disruptions, setDisruptions] = useState({});
    const [selectedDisruption, setSelectedDisruption] = useState({
        line: null,
        index: 0
    });

    useEffect(() => {
        const loadDisruptions = async () => {
            try {
                const data = await fetchDisruptions();
                console.log('Données des perturbations:', data);
                setDisruptions(data);
            } catch (error) {
                console.error('Erreur lors du chargement des perturbations:', error);
            }
        };

        loadDisruptions();
    }, []);

    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem('favorites')) || {};

        const formattedFavorites = Object.entries(favs).map(([stopName, lines]) => ({
            stopName,
            lines: Object.keys(lines),
        }));

        setFavorites(formattedFavorites);
    }, []);

    useEffect(() => {
        const loadInfos = async () => {
            const stops = await fetchStops();
            const infos = {};

            for (const favStop of favorites) {
                const cleanedName = favStop.stopName.trim().toLowerCase();
                const stopCodes = stops
                    .filter(stop => stop.libelle.trim().toLowerCase() === cleanedName)
                    .map(stop => stop.codeLieu);

                const uniqueCodes = [...new Set(stopCodes)];
                const allTimes = [];

                for (const code of uniqueCodes) {
                    try {
                        const stopTimes = await fetchStopTimes(code);

                        stopTimes.forEach(item => {
                            const ligne = item.ligne?.numLigne || '';
                            const terminus = item.terminus || '';
                            const temps = item.temps || '';

                            allTimes.push({ ligne, terminus, temps });
                        });
                    } catch (err) {
                        console.error(`Erreur lors du fetch pour ${favStop.stopName}`, err);
                    }
                }

                infos[favStop.stopName] = allTimes;
            }

            setFavoriteInfos(infos);
        };

        if (favorites.length > 0) {
            loadInfos();
        }
    }, [favorites]);

    const removeFavoriteLine = (stopName, line) => {
        const favs = JSON.parse(localStorage.getItem('favorites')) || {};

        if (favs[stopName]) {
            delete favs[stopName][line];

            if (Object.keys(favs[stopName]).length === 0) {
                delete favs[stopName];
            }
        }

        localStorage.setItem('favorites', JSON.stringify(favs));

        const updatedFavorites = Object.entries(favs).map(([stopName, lines]) => ({
            stopName,
            lines: Object.keys(lines),
        }));

        setFavorites(updatedFavorites);
    };

    return (
        <div>
            {favorites.length === 0 ? (
                <p>Aucun arrêt en favori</p>
            ) : (
                favorites.map((favStop, index) => {
                    const { stopName, lines } = favStop;
                    const infos = favoriteInfos[stopName] || [];

                    return (
                        <div className="stop" key={index} onClick={() => clickOnStop(stopName)}>
                            <div className="presentation">
                                <div className="infos">
                                    <div className="name">
                                        <h2>{stopName}</h2>
                                    </div>
                                    <div className="lines">
                                        {lines.length > 0 ? (
                                            lines.map((line, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`../../pics/Picto ligne ${line}.svg`}
                                                    alt={`Ligne ${line}`}
                                                />
                                            ))
                                        ) : (
                                            <p>Aucune ligne favorite</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {lines.map((line, idx) => {
                                const terminusInfo = infos.filter(info => info.ligne === line);
                                const lineDisruptions = disruptions[line];

                                return (
                                    <div key={idx} className="block-plus" style={{ cursor: 'pointer' }}>
                                        <div className="picinfos-plus">
                                            <div className="pic">
                                                <img
                                                    src={`../../pics/Picto ligne ${line}.svg`}
                                                    alt={`Ligne ${line}`}
                                                />
                                            </div>
                                            <div className="infos">
                                                <h3>
                                                    {terminusInfo.slice(0, 2).map((info, tIdx) => (
                                                        <span key={tIdx}>
                                                            &gt; {info.terminus}
                                                            {tIdx < terminusInfo.length - 1 && <br />}
                                                        </span>
                                                    ))}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="times">
                                            {terminusInfo.slice(0, 2).map((info, tIdx) => (
                                                <div key={tIdx} className="times-child">
                                                    <p>
                                                        {info.temps?.toLowerCase().trim() === 'proche'
                                                            ? 'Proche'
                                                            : !info.temps || info.temps.trim() === ''
                                                                ? 'Inconnu'
                                                                : `${info.temps}`}
                                                    </p>
                                                    <img src="../../icon_rt.svg" alt="Refresh Icon" />
                                                </div>
                                            ))}
                                        </div>

                                        {lineDisruptions && lineDisruptions.length > 0 && (
                                            <div className="alerte" onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDisruption({
                                                    line: line,
                                                    index: 0
                                                });
                                            }}>
                                                !
                                            </div>
                                        )}

                                        <div className="favorite" onClick={(e) => {
                                            e.stopPropagation();
                                            removeFavoriteLine(stopName, line);
                                        }}>
                                            <img
                                                src="../../Star_fill.svg"
                                                alt="Favori"
                                                style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })
            )}

            {/* Modal des perturbations */}
            {selectedDisruption.line && disruptions[selectedDisruption.line] && (
                <div className="modal-overlay" onClick={() => setSelectedDisruption({ line: null, index: 0 })}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>
                            Perturbation sur la ligne
                            <img src={`../../pics/Picto ligne ${selectedDisruption.line}.svg`} alt="" />
                            ({selectedDisruption.index + 1}/{disruptions[selectedDisruption.line].length})
                        </h3>

                        <div className="date">
                            <p>
                                <strong>Début:</strong>
                                {disruptions[selectedDisruption.line][selectedDisruption.index].date_debut}
                                {disruptions[selectedDisruption.line][selectedDisruption.index].heure_debut && ` à ${disruptions[selectedDisruption.line][selectedDisruption.index].heure_debut}`}
                            </p>
                            <p>
                                <strong>Fin:</strong>
                                {disruptions[selectedDisruption.line][selectedDisruption.index].date_fin}
                                {disruptions[selectedDisruption.line][selectedDisruption.index].heure_fin && ` à ${disruptions[selectedDisruption.line][selectedDisruption.index].heure_fin}`}
                            </p>
                        </div>

                        <p className="title">
                            <strong>Intitulé:</strong>
                            {disruptions[selectedDisruption.line][selectedDisruption.index].intitule || "Non disponible"}
                        </p>

                        <div className="resume">
                            <p>
                                <strong>Résumé:</strong>
                                {disruptions[selectedDisruption.line][selectedDisruption.index].resume || "Non disponible"}
                            </p>
                        </div>

                        <div className="navigation-buttons">
                            {selectedDisruption.index > 0 && (
                                <button
                                    className="prev-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDisruption(prev => ({
                                            ...prev,
                                            index: prev.index - 1
                                        }));
                                    }}
                                >
                                    Précédent
                                </button>
                            )}

                            {selectedDisruption.index < disruptions[selectedDisruption.line].length - 1 && (
                                <button
                                    className="next-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDisruption(prev => ({
                                            ...prev,
                                            index: prev.index + 1
                                        }));
                                    }}
                                >
                                    Suivant
                                </button>
                            )}
                        </div>

                        <button
                            className="close-button"
                            onClick={() => setSelectedDisruption({ line: null, index: 0 })}
                        >
                            <img src="../../croix.svg" alt="Fermer" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Favorite;