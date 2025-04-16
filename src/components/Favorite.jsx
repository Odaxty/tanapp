'use client';

import { useEffect, useState } from 'react';
import { fetchStops, fetchStopTimes, fetchDisruptions } from '../services/api';

const Favorite = ({ clickOnStop }) => {
    const [favorites, setFavorites] = useState([]);
    const [favoriteInfos, setFavoriteInfos] = useState({});
    const [disruptions, setDisruptions] = useState({});
    const [selectedDisruption, setSelectedDisruption] = useState({ line: null, index: 0 });
    const [showPlanImage, setShowPlanImage] = useState(false);
    const [planImageUrl, setPlanImageUrl] = useState('');

    const extractImageUrl = (text) => {
        const matches = text.match(/(https?:\/\/[^\s]+)/g);
        return matches ? matches[0] : null;
    };

    useEffect(() => {
        const loadDisruptions = async () => {
            try {
                const data = await fetchDisruptions();
                setDisruptions(data);
            } catch (error) {
                console.error('Erreur perturbations:', error);
            }
        };
        loadDisruptions();
    }, []);

    useEffect(() => {
        const favs = JSON.parse(localStorage.getItem('favorites')) || {};
        const formatted = Object.entries(favs).map(([stopName, lines]) => ({
            stopName,
            lines: Object.keys(lines),
        }));
        setFavorites(formatted);
    }, []);

    useEffect(() => {
        const loadInfos = async () => {
            const stops = await fetchStops();
            const infos = {};

            for (const fav of favorites) {
                const cleanedName = fav.stopName.trim().toLowerCase();
                const stopCodes = [...new Set(
                    stops.filter(s => s.libelle.trim().toLowerCase() === cleanedName).map(s => s.codeLieu)
                )];

                const allTimes = [];

                for (const code of stopCodes) {
                    try {
                        const stopTimes = await fetchStopTimes(code);
                        stopTimes.forEach(({ ligne, terminus, temps }) => {
                            allTimes.push({
                                ligne: ligne?.numLigne || '',
                                terminus: terminus || '',
                                temps: temps || '',
                            });
                        });
                    } catch (err) {
                        console.error(`Erreur pour ${fav.stopName}`, err);
                    }
                }

                infos[fav.stopName] = allTimes;
            }

            setFavoriteInfos(infos);
        };

        if (favorites.length > 0) loadInfos();
    }, [favorites]);

    const removeFavoriteLine = (stopName, line) => {
        const favs = JSON.parse(localStorage.getItem('favorites')) || {};
        if (favs[stopName]) {
            delete favs[stopName][line];
            if (Object.keys(favs[stopName]).length === 0) delete favs[stopName];
        }
        localStorage.setItem('favorites', JSON.stringify(favs));
        const updated = Object.entries(favs).map(([name, lines]) => ({
            stopName: name,
            lines: Object.keys(lines),
        }));
        setFavorites(updated);
    };

    const renderTimes = (info) => {
        const time = info.temps?.trim().toLowerCase();
        return time === 'proche' ? 'Proche' : time === '' ? 'Inconnu' : time;
    };

    const disruptionData = selectedDisruption.line ? disruptions[selectedDisruption.line]?.[selectedDisruption.index] : null;

    return (
        <div>
            {favorites.length === 0 ? (
                <p className="noneFavStops">Aucun arrêt en favori</p>
            ) : (
                favorites.map((fav, index) => {
                    const infos = favoriteInfos[fav.stopName] || [];
                    return (
                        <div className="stop" key={index} onClick={() => clickOnStop(fav.stopName)}>
                            <div className="presentation">
                                <div className="infos">
                                    <h2>{fav.stopName}</h2>
                                    <div className="lines">
                                        {fav.lines.length > 0 ? (
                                            fav.lines.map((line, i) => (
                                                <img key={i} src={`../../pics/Picto ligne ${line}.svg`} alt={`Ligne ${line}`} />
                                            ))
                                        ) : (
                                            <p>Aucune ligne favorite</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {fav.lines.map((line, i) => {
                                const terminusInfo = infos.filter(info => info.ligne === line).slice(0, 2);
                                const lineDisruptions = disruptions[line];

                                return (
                                    <div key={i} className="block-plus" style={{ cursor: 'pointer' }}>
                                        <div className="picinfos-plus">
                                            <div className="pic">
                                                <img src={`../../pics/Picto ligne ${line}.svg`} alt={`Ligne ${line}`} />
                                            </div>
                                            <div className="infos">
                                                <h3>
                                                    {terminusInfo.map((info, j) => (
                                                        <span key={j}>
                                                            &gt; {info.terminus}
                                                            {j < terminusInfo.length - 1 && <br />}
                                                        </span>
                                                    ))}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="times">
                                            {terminusInfo.map((info, j) => (
                                                <div key={j} className="times-child">
                                                    <p>{renderTimes(info)}</p>
                                                    <img src="../../icon_rt.svg" alt="Refresh Icon" />
                                                </div>
                                            ))}
                                        </div>

                                        {lineDisruptions?.length > 0 && (
                                            <div className="alerte" onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDisruption({ line, index: 0 });
                                                setShowPlanImage(false);
                                            }}>
                                                !
                                            </div>
                                        )}

                                        <div className="favorite" onClick={(e) => {
                                            e.stopPropagation();
                                            removeFavoriteLine(fav.stopName, line);
                                        }}>
                                            <img src="../../Star_fill.svg" alt="Favori" style={{ width: '50px', height: '50px', cursor: 'pointer' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })
            )}

            {disruptionData && (
                <div className="modal-overlay" onClick={() => setSelectedDisruption({ line: null, index: 0 })}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>
                            Perturbation sur la ligne
                            <img src={`../../pics/Picto ligne ${selectedDisruption.line}.svg`} alt="" />
                            ({selectedDisruption.index + 1}/{disruptions[selectedDisruption.line].length})
                        </h3>

                        <div className="date">
                            <p><strong>Début:</strong> {disruptionData.date_debut} {disruptionData.heure_debut && `à ${disruptionData.heure_debut}`}</p>
                            <p><strong>Fin:</strong> {disruptionData.date_fin} {disruptionData.heure_fin && `à ${disruptionData.heure_fin}`}</p>
                        </div>

                        <p className="title"><strong>Intitulé:</strong> {disruptionData.intitule || 'Non disponible'}</p>

                        <div className="resume">
                            <p><strong>Résumé:</strong> {disruptionData.resume.split('https://')[0]}</p>

                            {extractImageUrl(disruptionData.resume) && (
                                <>
                                    <button
                                        onClick={() => {
                                            setPlanImageUrl(extractImageUrl(disruptionData.resume) || '');
                                            setShowPlanImage(!showPlanImage);
                                        }}
                                        className="show-plan-button"
                                    >
                                        {showPlanImage ? 'Masquer le plan' : 'Voir le plan de déviation'}
                                    </button>
                                    {showPlanImage && planImageUrl && (
                                        <div className="plan-image-container">
                                            <img src={planImageUrl} alt="Plan de déviation" className="deviation-plan" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="navigation-buttons">
                            {selectedDisruption.index > 0 && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDisruption(prev => ({ ...prev, index: prev.index - 1 }));
                                }}>
                                    Précédent
                                </button>
                            )}
                            {selectedDisruption.index < disruptions[selectedDisruption.line].length - 1 && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDisruption(prev => ({ ...prev, index: prev.index + 1 }));
                                }}>
                                    Suivant
                                </button>
                            )}
                        </div>

                        <button className="close-button" onClick={() => setSelectedDisruption({ line: null, index: 0 })}>
                            <img src="../../croix.svg" alt="Fermer" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Favorite;
