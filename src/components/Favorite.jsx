'use client';

import { useEffect, useState } from 'react';
import { fetchStops, fetchStopTimes } from '../services/api';

const Favorite = ({ clickOnStop }) => {
    const [favorites, setFavorites] = useState([]);
    const [favoriteInfos, setFavoriteInfos] = useState({});


    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem('favorites')) || {};

        // Transformer l'objet en tableau d'arrêts et leurs lignes
        const formattedFavorites = Object.entries(favs).map(([stopName, lines]) => ({
            stopName,
            lines: Object.keys(lines), // Convertir les lignes en tableau ["1", "2", "3", "26"]
        }));

        setFavorites(formattedFavorites);
    }, []);

    useEffect(() => {
        const loadInfos = async () => {
            const stops = await fetchStops();
            const infos = {};

            // Parcours des arrêts favoris pour récupérer leurs codes et leurs horaires
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
            delete favs[stopName][line]; // Supprime la ligne du favori

            // Si plus aucune ligne n'est enregistrée pour cet arrêt, supprime complètement l'arrêt
            if (Object.keys(favs[stopName]).length === 0) {
                delete favs[stopName];
            }
        }

        localStorage.setItem('favorites', JSON.stringify(favs));

        // Mettre à jour l'état pour refléter le changement
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

                            {/* Affichage des lignes favorites */}
                            {lines.map((line, idx) => {
                                const terminusInfo = infos.filter(info => info.ligne === line);

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
                                                {/* Affichage des 2 terminus disponibles */}
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
                                            {/* Affichage du temps pour chaque terminus */}
                                            {terminusInfo.slice(0, 2).map((info, tIdx) => (
                                                <div key={tIdx} className="times-child">
                                                    <p>
                                                        {info.temps?.toLowerCase().trim() === 'proche'
                                                            ? 'Proche'
                                                            : !info.temps || info.temps.trim() === '' // Vérifie si `temps` est vide ou undefined
                                                                ? 'Inconnu'
                                                                : `${info.temps} `}
                                                    </p>
                                                    <img src="../../icon_rt.svg" alt="Refresh Icon" />
                                                </div>
                                            ))}
                                        </div>


                                        {/* Icône d'étoile activée pour les favoris */}
                                        <div className="favorite" onClick={(e) => {
                                            e.stopPropagation(); // Empêche l'événement de remonter au parent
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
        </div>
    );
};

export default Favorite;
