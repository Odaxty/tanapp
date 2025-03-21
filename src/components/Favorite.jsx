'use client';

import { useEffect, useState } from 'react';
import { fetchStops, fetchStopTimes } from '../services/api';

const Favorite = ({ setSelectedStop }) => {
    const [favorites, setFavorites] = useState([]);
    const [favoriteInfos, setFavoriteInfos] = useState({});

    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorites(favs);
    }, []);

    useEffect(() => {
        const loadInfos = async () => {
            const stops = await fetchStops();
            const infos = {};

            for (const favStop of favorites) {
                const cleanedName = favStop.trim().toLowerCase();
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
                        console.error(`Erreur lors du fetch pour ${favStop}`, err);
                    }
                }

                infos[favStop] = allTimes;
            }

            setFavoriteInfos(infos);
        };

        if (favorites.length > 0) {
            loadInfos();
        }
    }, [favorites]);

    return (
        <div>
            {favorites.length === 0 ? (
                <p>Aucun arrêt en favori</p>
            ) : (
                favorites.map((favStop, index) => {
                    const infos = favoriteInfos[favStop] || [];
                    const firstLine = infos[0] || {};
                    const ligne = firstLine.ligne || '';
                    const terminus = firstLine.terminus || '';
                    const temps = firstLine.temps || '';

                    return (
                        <div className="block-link" key={index} onClick={() => setSelectedStop(favStop)}>
                            <div className="block">
                                <div className="picinfos">
                                    <div className="pic">
                                        {ligne ? (
                                            <img src={`../../pics/Picto ligne ${ligne}.svg`} alt={`Ligne ${ligne}`} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px' }} />
                                        )}
                                    </div>
                                    <div className="infos">
                                        <h2>{ligne ? `${ligne} - ${favStop}` : favStop}</h2>
                                        <h3>{terminus ? `> ${terminus}` : ''}</h3>
                                    </div>
                                </div>
                                <div className="time">
                                    {temps ? (
                                        <p>{temps === 'Proche' ? 'Proche' : temps.replace('mn', ' min')}</p>
                                    ) : (
                                        <p>Chargement...</p>
                                    )}
                                    <img src="../../icon_rt.svg" alt="Actualiser" />
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Favorite;
