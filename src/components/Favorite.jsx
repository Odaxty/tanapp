const Favorite = () => {


    const busTimes = [
        { temps: 'Proche' },
        { temps: '2mn' },
        { temps: '5mn' },
    ];


    return (
        <div className="block-link" onClick={() => setSelectedStop('Commerce')}>
            <div className="block">
                <div className="picinfos">
                    <div className="pic">
                        <img src="../../pics/Picto ligne C6.svg" alt="Ligne C6"/>
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
                    <img src="../../icon_rt.svg" alt="Actualiser"/>
                </div>
            </div>
        </div>
    )
}

export default Favorite;