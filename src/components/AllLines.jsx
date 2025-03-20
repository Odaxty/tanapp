'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const fetchStops = async () => {
    const baseUrl = 'https://open.tan.fr/ewp/arrets.json';
    const lines = new Set();

    try {
        const response = await axios.get(baseUrl);
        response.data.forEach(stop => {
            if (stop.ligne && Array.isArray(stop.ligne)) {
                stop.ligne.forEach(line => {
                    if (line.numLigne) {
                        lines.add(line.numLigne);
                    }
                });
            }
        });
        return Array.from(lines).sort();
    } catch (error) {
        console.error("Erreur lors de la récupération des arrêts :", error);
        return [];
    }
};

const AllLines = () => {
    const [lines, setLines] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLines = async () => {
            try {
                const uniqueLines = await fetchStops();
                setLines(uniqueLines);
            } catch (error) {
                console.error('Erreur lors de la récupération des lignes:', error);
                setError('Erreur de chargement des lignes');
            }
        };

        fetchLines();
    }, []);

    return (
        <div className="all-lines">
            <h2>Toutes les lignes</h2>
            {error ? (
                <p>{error}</p>
            ) : (
                <div className="lines-grid">
                    {lines.map((numLigne, index) => (
                        <div key={index} className="line-item">
                            <img src={`../../pics/Picto ligne ${numLigne}.svg`} alt={`Ligne ${numLigne}`} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllLines;
