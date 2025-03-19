'use client';

import { useEffect, useState } from 'react';
import { fetchStops } from '../services/api';

const SearchBar = () => {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [allStops, setAllStops] = useState([]);

    useEffect(() => {
        const loadStops = async () => {
            try {
                const stops = await fetchStops();
                setAllStops(stops);
            } catch (error) {
                console.error('Erreur lors de la récupération des arrêts:', error);
            }
        };

        loadStops();
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearch(value);

        const startsWithSuggestions = allStops
            .filter(stop => stop.libelle.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 3);

        const containsSuggestions = allStops
            .filter(stop => stop.libelle.toLowerCase().includes(value.toLowerCase()) && !startsWithSuggestions.includes(stop))
            .slice(0, 3 - startsWithSuggestions.length);

        const finalSuggestions = [...startsWithSuggestions, ...containsSuggestions];

        setSuggestions(finalSuggestions);
    };

    return (
        <div>
            <input
                className="searchBar"
                type="text"
                value={search}
                onChange={handleInputChange}
                placeholder="Rechercher un arrêt..."
            />
            {search && (
                <div className="suggestions-container">
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="suggestion-item">
                            {suggestion.libelle}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
