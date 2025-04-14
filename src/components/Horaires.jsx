import React, { useEffect, useState } from 'react';
import { fetchHoraires } from '../services/api';

const Horaires = ({ stopCode, ligne, sens }) => {
    const [horairesData, setHorairesData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getHoraires = async () => {
            try {
                const data = await fetchHoraires(stopCode, ligne, sens);
                if (data) {
                    setHorairesData(data);
                } else {

                }
            } catch (err) {
                setError('Erreur lors de la récupération des horaires.');
                console.error(err);
            }
        };

        getHoraires();
    }, [stopCode, ligne, sens]);

    const formatHoraire = (heure) => {
        const heureNum = parseInt(heure, 10);
        return heureNum >= 24 ? `${heureNum - 24}h` : `${heureNum}h`;
    };

    if (error) {
        return <p>{error}</p>;
    }

    if (!horairesData) {
        return <p>Horaires indisponible</p>;
    }

    return (
        <div className="horaires-container">
            <span>Horaires pour l'arrêt </span><span><strong>{horairesData.arret.libelle}</strong></span>
            <h3>
                <img
                    src={`../../pics/Picto ligne ${horairesData.ligne.numLigne}.svg`}
                    alt={`Ligne ${horairesData.ligne.numLigne}`}
                />
                Direction {horairesData.ligne.directionSens1}
            </h3>

            <h4>v = Horaire uniquement disponible le vendredi</h4>

            {!horairesData.horaires.length ? (
                <p>Aucun horaire théorique n'est disponible.</p>
            ) : (
                <>
                    <h4>Prochains horaires :</h4>
                    <ul>
                        {horairesData.prochainsHoraires.map((horaire, index) => (
                            <li key={index}>
                                <strong>{formatHoraire(horaire.heure)}</strong>
                                {horaire.passages.map((p, i) => (
                                    <span key={i}>{p}</span>
                                ))}
                            </li>
                        ))}
                    </ul>

                    <h4>Horaires complets :</h4>
                    <ul>
                        {horairesData.horaires.map((horaire, index) => (
                            <li key={index}>
                                <strong>{formatHoraire(horaire.heure)}</strong>
                                {horaire.passages.map((p, i) => (
                                    <span key={i}>{p}</span>
                                ))}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default Horaires;