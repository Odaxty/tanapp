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

    const ligneScolaire = ["101", "102", "104", "105", "107", "108", "109", "111", "112", "115", "116", "117", "118", "119", "122", "126", "127", "128", "129", "131", "135", "137", "138", "139", "141", "142", "147", "148", "149", "152", "157", "158", "159", "162", "168", "169", "172", "179", "187", "189", "192"];

    const LineItem = ({ numLigne }) => {
        const [imageExists, setImageExists] = useState(true);
        const imageUrl = `../../pics/Picto ligne ${numLigne}.svg`;

        useEffect(() => {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => setImageExists(true);
            img.onerror = () => setImageExists(false);
        }, [imageUrl]);

        return (
            <div className={`line-item ${ligneScolaire.includes(numLigne) ? 'ligne-scolaire' : ''}`}>
                {imageExists ? (
                    <img src={imageUrl} alt={`Ligne ${numLigne}`} />
                ) : (
                    <span className="ligne-text">{numLigne}</span>
                )}
            </div>
        );
    };

    return (
        <div className="all-lines">
            <h2>Toutes les lignes</h2>
            {error ? (
                <p>{error}</p>
            ) : (
                <div className="lines-grid">
                    {lines.map((numLigne, index) => (
                        <LineItem key={index} numLigne={numLigne} />
                    ))}
                </div>
            )}
        </div>
    );

};

export default AllLines;
