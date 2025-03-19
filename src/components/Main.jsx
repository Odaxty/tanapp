'use client';
import { useState } from 'react';
import SearchBar from "@/components/SearchBar";
import Stop from '@/components/Stop';

const Main = () => {
    const [selectedStop, setSelectedStop] = useState(null);

    const handleStopClick = (stopName) => {
        setSelectedStop(stopName);
    }

    const busTimes = [
        { temps: 'Proche' },
        { temps: '2mn' },
        { temps: '5mn' },
    ];

    return (
        <div>
            <SearchBar
                setSelectedStop={setSelectedStop}
            />
            <div className="home-page">
                {!selectedStop && <h1 className="title">Arrêts favoris</h1>}

                {selectedStop ? (
                    <Stop
                        stopName={selectedStop}
                        onBack={() => setSelectedStop(null)}
                    />
                ) : (
                    <div className="block-link" onClick={() => setSelectedStop('Commerce')}>
                        <div className="block">
                            <div className="picinfos">
                                <div className="pic">
                                    <img src="../../pics/Picto ligne C6.svg" alt="Ligne C6" />
                                </div>
                                <div className="infos">
                                    <h2>C6 - Bonde</h2>
                                    <h3>&gt; Chantrerie Grandes Écoles</h3>
                                </div>
                            </div>
                            <div className="time">
                                {busTimes.length > 0 ? (
                                    <p>
                                        {busTimes[0].temps === 'Proche'
                                            ? 'Proche'
                                            : busTimes[0].temps.replace('mn', ' min')}
                                    </p>
                                ) : (
                                    <p>Chargement...</p>
                                )}
                                <img src="../../icon_rt.svg" alt="Actualiser" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Main;