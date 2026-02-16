'use client';

import { useEffect, useState } from 'react';
import { fetchStops } from '../services/api';

const SearchBar = ({ handleSearchStop, setIsFavoriteClicked, onBack, handleClosestStopClick, handleFavoriteClick }) => {
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

    const clickOnStop = (nameStop) => {
        setIsFavoriteClicked(false);  // Désactivation des favoris
        handleSearchStop(nameStop);  // Sélectionner l'arrêt
        setSearch("");  // Réinitialise la recherche
    };

    return (
        <div className="fullContentNavBar">
            <button className="buttonBack">
                <img src="../../TANAPP.svg" onClick={onBack} alt="" />
            </button>
            <div className="searchBar">
                <input
                    className="searchBarInput"
                    type="text"
                    value={search}
                    onChange={handleInputChange}
                    placeholder="Rechercher un arrêt..."
                />
                <div className="searchBarLine"></div>
                <button className="searchBarButton" onClick={handleClosestStopClick}>
                    <img src="../../location.svg" alt="" />
                </button>
                {search && (
                    <div className="suggestions-container">
                        {suggestions.map((suggestion) => (
                            <div key={suggestion.libelle} className="suggestion-item">

                                <p
                                    className="suggestion-item-text"
                                    onClick={() => clickOnStop(suggestion.libelle)}  // Passer l'arrêt sélectionné
                                >
                                    {suggestion.libelle}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="buttonFavorite" onClick={() => handleFavoriteClick()}>
                <img src="../../Star_fill.svg" alt="" />
            </button>
        </div>
    );
};

export default SearchBar;
